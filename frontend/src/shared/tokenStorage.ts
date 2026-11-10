type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const tokenKey = 'arena.auth.token'

export function loadToken(storage?: TokenStorage): string | null {
    try {
        return (storage ?? globalThis.localStorage).getItem(tokenKey)
    } catch {
        return null
    }
}

export function saveToken(token: string, storage?: TokenStorage): void {
    try {
        (storage ?? globalThis.localStorage).setItem(tokenKey, token)
    } catch {
        // The current session can continue in memory when storage is blocked.
    }
}

export function clearToken(storage?: TokenStorage): void {
    try {
        (storage ?? globalThis.localStorage).removeItem(tokenKey)
    } catch {
        // Storage may be unavailable even when the token was readable earlier.
    }
}
