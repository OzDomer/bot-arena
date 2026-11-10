import { ApiError, deleteMe, getMe, login, register, renameMe } from '../../shared/api'
import { clearToken, loadToken, saveToken } from '../../shared/tokenStorage'
import { authReducer, initialAuthState, type AuthAction, type AuthOperation } from './authState'

const defaultApi = { register, login, getMe, renameMe, deleteMe }
const defaultStorage = { loadToken, saveToken, clearToken }

export function createAuthSession(api = defaultApi, storage = defaultStorage) {
    let state = initialAuthState(storage.loadToken())
    let active = false
    let generation = 0
    const listeners = new Set<() => void>()

    function dispatch(action: AuthAction) {
        if (!active) return
        const previousToken = state.token
        state = authReducer(state, action)
        if (state.token !== previousToken) {
            if (state.token) storage.saveToken(state.token)
            else storage.clearToken()
        }
        for (const listener of listeners) listener()
    }

    async function run(operation: AuthOperation, request: () => Promise<AuthAction>) {
        if (!active || state.pending) return
        const requestGeneration = ++generation
        dispatch({ type: 'start', operation })
        try {
            const action = await request()
            if (active && generation === requestGeneration) dispatch(action)
        } catch (error: unknown) {
            if (!active || generation !== requestGeneration) return
            dispatch({
                type: 'failed',
                message: error instanceof Error ? error.message : 'Could not reach the server',
                expired: operation !== 'register' && operation !== 'login' && error instanceof ApiError && error.status === 401
            })
        }
    }

    function retry() {
        const token = state.token
        if (!token || state.status !== 'loading') return Promise.resolve()
        return run('restore', async () => ({ type: 'authenticated', token, user: await api.getMe(token) }))
    }

    return {
        getSnapshot: () => state,
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => { listeners.delete(listener) }
        },
        start() {
            active = true
            const mountGeneration = ++generation
            // StrictMode cleans up its first effect before this restoration starts.
            queueMicrotask(() => {
                if (active && generation === mountGeneration) void retry()
            })
            return () => {
                active = false
                generation++
            }
        },
        retry,
        register(name: string, password: string) {
            return run('register', async () => ({ type: 'authenticated', ...await api.register(name, password) }))
        },
        login(name: string, password: string) {
            return run('login', async () => ({ type: 'authenticated', ...await api.login(name, password) }))
        },
        logout() {
            generation++
            dispatch({ type: 'logout' })
        },
        rename(name: string) {
            const token = state.token
            if (!token || state.status !== 'authenticated') return Promise.resolve()
            return run('rename', async () => ({ type: 'renamed', user: await api.renameMe(token, name) }))
        },
        deleteAccount() {
            const token = state.token
            if (!token || state.status !== 'authenticated') return Promise.resolve()
            return run('delete', async () => {
                await api.deleteMe(token)
                return { type: 'deleted' }
            })
        }
    }
}
