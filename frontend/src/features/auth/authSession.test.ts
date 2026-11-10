import { describe, expect, it, vi } from 'vitest'
import { ApiError, type User } from '../../shared/api'
import { createAuthSession } from './authSession'

const token = 'session-token'
const user = { id: 1, name: 'viewer', credits: 1000, createdAt: '2026-01-01T00:00:00.000Z' }

function setup(storedToken: string | null = null) {
    const api = {
        register: vi.fn().mockResolvedValue({ token, user }),
        login: vi.fn().mockResolvedValue({ token, user }),
        getMe: vi.fn().mockResolvedValue(user),
        renameMe: vi.fn().mockResolvedValue({ ...user, name: 'renamed' }),
        deleteMe: vi.fn().mockResolvedValue(undefined)
    }
    const storage = {
        loadToken: vi.fn(() => storedToken),
        saveToken: vi.fn(),
        clearToken: vi.fn()
    }
    return { api, storage, session: createAuthSession(api, storage) }
}

function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (error: unknown) => void
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

describe('auth session', () => {
    it('restores a stored token with getMe and keeps that token', async () => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()

        expect(api.getMe).toHaveBeenCalledExactlyOnceWith(token)
        expect(session.getSnapshot()).toMatchObject({ status: 'authenticated', user, token })
        expect(storage.clearToken).not.toHaveBeenCalled()
    })

    it('clears persisted storage and becomes anonymous when getMe returns 401', async () => {
        const { api, storage, session } = setup(token)
        api.getMe.mockRejectedValue(new ApiError(401, 'authentication required'))
        session.start()
        await session.retry()

        expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', token: null, user: null, error: 'authentication required' })
        expect(storage.clearToken).toHaveBeenCalledOnce()
    })

    it('keeps the token after a network failure and authenticates when retry succeeds', async () => {
        const { api, storage, session } = setup(token)
        api.getMe.mockRejectedValueOnce(new TypeError('Failed to fetch'))
        session.start()
        await session.retry()

        expect(session.getSnapshot()).toMatchObject({ status: 'loading', token, error: 'Failed to fetch', pending: null })
        expect(storage.clearToken).not.toHaveBeenCalled()
        await session.retry()
        expect(session.getSnapshot()).toMatchObject({ status: 'authenticated', token, user, error: null })
    })

    it.each(['register', 'login'] as const)('saves the returned token after %s succeeds', async operation => {
        const { api, storage, session } = setup()
        session.start()
        await session[operation]('viewer', 'long-password')

        expect(api[operation]).toHaveBeenCalledExactlyOnceWith('viewer', 'long-password')
        expect(session.getSnapshot()).toMatchObject({ status: 'authenticated', token, user })
        expect(storage.saveToken).toHaveBeenCalledExactlyOnceWith(token)
    })

    it('keeps a failed login anonymous and exposes the server message without saving a token', async () => {
        const { api, storage, session } = setup()
        api.login.mockRejectedValue(new ApiError(401, 'invalid name or password'))
        session.start()
        await session.login('viewer', 'wrong-password')

        expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', token: null, error: 'invalid name or password', pending: null })
        expect(storage.saveToken).not.toHaveBeenCalled()
    })

    it('renames with the current token and keeps the token without rewriting storage', async () => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()
        await session.rename('renamed')

        expect(api.renameMe).toHaveBeenCalledExactlyOnceWith(token, 'renamed')
        expect(session.getSnapshot()).toMatchObject({ status: 'authenticated', token, user: { ...user, name: 'renamed' } })
        expect(storage.saveToken).not.toHaveBeenCalled()
        expect(storage.clearToken).not.toHaveBeenCalled()
    })

    it.each([400, 409])('keeps the account and exposes the server message after a rename %i', async status => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()
        api.renameMe.mockRejectedValue(new ApiError(status, 'name is unavailable'))
        await session.rename('renamed')

        expect(session.getSnapshot()).toMatchObject({ status: 'authenticated', token, user, pending: null, error: 'name is unavailable' })
        expect(storage.clearToken).not.toHaveBeenCalled()
    })

    it.each(['rename', 'deleteAccount'] as const)('clears persisted storage and logs out on a 401 during %s', async operation => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()
        api.renameMe.mockRejectedValue(new ApiError(401, 'authentication required'))
        api.deleteMe.mockRejectedValue(new ApiError(401, 'authentication required'))
        await session[operation]('renamed')

        expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', token: null, user: null, error: 'authentication required' })
        expect(storage.clearToken).toHaveBeenCalledOnce()
    })

    it('clears persisted storage and the user on logout without making another request', async () => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()
        session.logout()

        expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', token: null, user: null })
        expect(storage.clearToken).toHaveBeenCalledOnce()
        expect(api.deleteMe).not.toHaveBeenCalled()
        expect(api.getMe).toHaveBeenCalledOnce()
    })

    it('deletes with the current token and clears persisted storage and the user on success', async () => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()
        await session.deleteAccount()

        expect(api.deleteMe).toHaveBeenCalledExactlyOnceWith(token)
        expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', token: null, user: null, pending: null })
        expect(storage.clearToken).toHaveBeenCalledOnce()
    })

    it('keeps the account and token retryable when deletion fails with a network error', async () => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()
        api.deleteMe.mockRejectedValueOnce(new TypeError('Failed to fetch'))
        await session.deleteAccount()

        expect(session.getSnapshot()).toMatchObject({ status: 'authenticated', token, user, pending: null, error: 'Failed to fetch' })
        expect(storage.clearToken).not.toHaveBeenCalled()
        await session.deleteAccount()
        expect(session.getSnapshot().status).toBe('anonymous')
    })

    it('starts only one getMe request during a StrictMode setup, cleanup and setup sequence', async () => {
        const { api, session } = setup(token)
        session.start()()
        const stop = session.start()
        await new Promise<void>(resolve => queueMicrotask(resolve))

        expect(api.getMe).toHaveBeenCalledExactlyOnceWith(token)
        await vi.waitFor(() => expect(session.getSnapshot().status).toBe('authenticated'))
        stop()
    })

    it('does not start getMe if the session unmounts before the restoration microtask', async () => {
        const { api, session } = setup(token)
        session.start()()
        await new Promise<void>(resolve => queueMicrotask(resolve))
        expect(api.getMe).not.toHaveBeenCalled()
    })

    it.each(['resolve', 'reject'] as const)('does not update state, storage or listeners when getMe %ss after unmount', async outcome => {
        const { api, storage, session } = setup(token)
        const request = deferred<User>()
        api.getMe.mockReturnValue(request.promise)
        const listener = vi.fn()
        session.subscribe(listener)
        const stop = session.start()
        const pending = session.retry()
        stop()
        const snapshot = session.getSnapshot()
        listener.mockClear()
        if (outcome === 'resolve') request.resolve(user)
        else request.reject(new ApiError(401, 'authentication required'))
        await pending

        expect(session.getSnapshot()).toBe(snapshot)
        expect(listener).not.toHaveBeenCalled()
        expect(storage.saveToken).not.toHaveBeenCalled()
        expect(storage.clearToken).not.toHaveBeenCalled()
    })

    it('ignores a late successful rename after logout', async () => {
        const { api, storage, session } = setup(token)
        session.start()
        await session.retry()
        const request = deferred<User>()
        api.renameMe.mockReturnValue(request.promise)
        const pending = session.rename('renamed')
        session.logout()
        request.resolve({ ...user, name: 'renamed' })
        await pending

        expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', user: null, token: null })
        expect(storage.clearToken).toHaveBeenCalledOnce()
    })

    it('ignores a late successful login after logout', async () => {
        const { api, storage, session } = setup()
        session.start()
        const request = deferred<{ token: string; user: User }>()
        api.login.mockReturnValue(request.promise)
        const pending = session.login('viewer', 'long-password')
        session.logout()
        request.resolve({ token, user })
        await pending

        expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', user: null, token: null })
        expect(storage.saveToken).not.toHaveBeenCalled()
    })

    it('allows only one in-flight login request and exposes the pending operation', async () => {
        const { api, session } = setup()
        session.start()
        const request = deferred<{ token: string; user: User }>()
        api.login.mockReturnValue(request.promise)
        const pending = session.login('viewer', 'long-password')
        expect(session.getSnapshot().pending).toBe('login')
        await session.login('viewer', 'long-password')
        expect(api.login).toHaveBeenCalledOnce()
        request.resolve({ token, user })
        await pending
        expect(session.getSnapshot().pending).toBeNull()
    })
})
