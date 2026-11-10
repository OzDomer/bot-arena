import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, deleteMe, getLive, getMatch, getMe, login, register, renameMe, streamUrl } from './api'

afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
})

const user = { id: 1, name: 'viewer', credits: 1000, createdAt: '2026-01-01T00:00:00.000Z' }
const credentials = { name: 'viewer', password: 'long-password' }
const token = 'session-token'

const authRequests = [
    {
        name: 'register',
        call: () => register(credentials.name, credentials.password),
        path: '/auth/register',
        options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) },
        result: { token, user },
        status: 201
    },
    {
        name: 'login',
        call: () => login(credentials.name, credentials.password),
        path: '/auth/login',
        options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) },
        result: { token, user },
        status: 200
    },
    {
        name: 'getMe',
        call: () => getMe(token),
        path: '/me',
        options: { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
        result: user,
        status: 200
    },
    {
        name: 'renameMe',
        call: () => renameMe(token, 'renamed'),
        path: '/me',
        options: {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: 'renamed' })
        },
        result: { ...user, name: 'renamed' },
        status: 200
    },
    {
        name: 'deleteMe',
        call: () => deleteMe(token),
        path: '/me',
        options: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
        result: undefined,
        status: 204
    }
]

describe('auth API', () => {
    it.each(authRequests)('$name sends the method, URL, headers and body and resolves the response', async ({ call, path, options, result, status }) => {
        vi.stubEnv('VITE_API_URL', '/api/')
        const response = status === 204 ? new Response(null, { status }) : Response.json(result, { status })
        const fetch = vi.fn().mockResolvedValue(response)
        vi.stubGlobal('fetch', fetch)

        expect(await call()).toEqual(result)
        expect(fetch.mock.calls).toEqual([[`/api${path}`, options]])
    })

    it.each(authRequests)('$name turns a 4xx into an ApiError with the server message and status', async ({ call }) => {
        vi.stubEnv('VITE_API_URL', '/api')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'name already taken' }, { status: 409 })))

        const error = await call().catch((error: unknown) => error)
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ status: 409, message: 'name already taken' })
    })

    it('deleteMe resolves on 204 without parsing a body', async () => {
        vi.stubEnv('VITE_API_URL', '/api')
        const response = new Response(null, { status: 204 })
        const json = vi.spyOn(response, 'json')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(deleteMe(token)).resolves.toBeUndefined()
        expect(json).not.toHaveBeenCalled()
    })

    it('turns a non-JSON error page into an ApiError with a generic message and status', async () => {
        vi.stubEnv('VITE_API_URL', '/api')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>proxy failure</html>', { status: 502 })))

        const error = await getMe(token).catch((error: unknown) => error)
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ status: 502, message: 'Could not read the server response' })
    })

    it('uses a generic ApiError when a JSON error has no string message', async () => {
        vi.stubEnv('VITE_API_URL', '/api')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: null }, { status: 500 })))

        await expect(getMe(token)).rejects.toMatchObject({ name: 'ApiError', status: 500, message: 'Request failed' })
    })

    it('turns a non-JSON successful response into an ApiError', async () => {
        vi.stubEnv('VITE_API_URL', '/api')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>proxy page</html>')))

        await expect(getMe(token)).rejects.toMatchObject({ name: 'ApiError', status: 200, message: 'Could not read the server response' })
    })
})

describe('API', () => {
    it('uses the configured base for requests and the stream', async () => {
        vi.stubEnv('VITE_API_URL', '/api/')
        const live = { now: '2026-01-01T00:00:00.000Z', msPerTurn: 150, current: null, next: null }
        const match = { matchId: 7, phase: 'scheduled', opensAt: live.now }
        const fetch = vi.fn()
            .mockResolvedValueOnce(Response.json(live))
            .mockResolvedValueOnce(Response.json(match))
        vi.stubGlobal('fetch', fetch)

        expect(await getLive()).toEqual(live)
        expect(await getMatch(7)).toEqual(match)
        expect(fetch.mock.calls).toEqual([['/api/live'], ['/api/matches/7']])
        expect(streamUrl()).toBe('/api/stream')
    })

    it('preserves the HTTP status and server message', async () => {
        vi.stubEnv('VITE_API_URL', '/api')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'not found' }, { status: 404 })))

        const error = await getMatch(7).catch((error: unknown) => error)
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ status: 404, message: 'not found' })
    })
})
