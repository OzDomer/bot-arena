import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearToken, loadToken, saveToken } from './tokenStorage'

afterEach(() => vi.unstubAllGlobals())

describe('token storage', () => {
    it('saves, loads and clears a token using injected storage', () => {
        const values = new Map<string, string>()
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => { values.set(key, value) },
            removeItem: (key: string) => { values.delete(key) }
        }

        expect(loadToken(storage)).toBeNull()
        saveToken('session-token', storage)
        expect(loadToken(storage)).toBe('session-token')
        clearToken(storage)
        expect(loadToken(storage)).toBeNull()
    })

    it('returns null on load and does not throw on save or clear when storage methods throw', () => {
        const blocked = () => { throw new Error('Storage is blocked') }
        const storage = { getItem: blocked, setItem: blocked, removeItem: blocked }

        expect(loadToken(storage)).toBeNull()
        expect(() => saveToken('session-token', storage)).not.toThrow()
        expect(() => clearToken(storage)).not.toThrow()
    })

    it('does not throw when accessing the browser storage object throws', () => {
        vi.stubGlobal('localStorage', undefined)
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            get: () => { throw new Error('Storage is blocked') }
        })
        try {
            expect(loadToken()).toBeNull()
            expect(() => saveToken('session-token')).not.toThrow()
            expect(() => clearToken()).not.toThrow()
        } finally {
            if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
        }
    })
})
