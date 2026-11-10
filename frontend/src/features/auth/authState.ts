import type { User } from '../../shared/api'

export type AuthOperation = 'restore' | 'register' | 'login' | 'rename' | 'delete'

export type AuthState = {
    status: 'loading' | 'anonymous' | 'authenticated'
    user: User | null
    token: string | null
    pending: AuthOperation | null
    error: string | null
}

export type AuthAction =
    | { type: 'start'; operation: AuthOperation }
    | { type: 'authenticated'; token: string; user: User }
    | { type: 'renamed'; user: User }
    | { type: 'failed'; message: string; expired: boolean }
    | { type: 'logout' }
    | { type: 'deleted' }

export function initialAuthState(token: string | null): AuthState {
    return { status: token ? 'loading' : 'anonymous', token, user: null, pending: null, error: null }
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'start':
            return { ...state, pending: action.operation, error: null }
        case 'authenticated':
            return { status: 'authenticated', token: action.token, user: action.user, pending: null, error: null }
        case 'renamed':
            return { ...state, user: action.user, pending: null, error: null }
        case 'failed':
            return { ...(action.expired ? initialAuthState(null) : state), pending: null, error: action.message }
        case 'logout':
        case 'deleted':
            return initialAuthState(null)
    }
}
