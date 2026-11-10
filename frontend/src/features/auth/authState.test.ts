import { describe, expect, it } from 'vitest'
import { authReducer, initialAuthState } from './authState'

const token = 'session-token'
const user = { id: 1, name: 'viewer', credits: 1000, createdAt: '2026-01-01T00:00:00.000Z' }
const authenticated = authReducer(initialAuthState(null), { type: 'authenticated', token, user })

describe('auth state', () => {
    it('starts anonymous without a stored token', () => {
        expect(initialAuthState(null)).toEqual({ status: 'anonymous', token: null, user: null, pending: null, error: null })
    })

    it('moves from a stored token through loading to authenticated after getMe succeeds', () => {
        const loading = initialAuthState(token)
        expect(loading).toMatchObject({ status: 'loading', token, user: null })
        const pending = authReducer(loading, { type: 'start', operation: 'restore' })
        expect(pending.pending).toBe('restore')
        expect(authReducer(pending, { type: 'authenticated', token, user })).toEqual(authenticated)
    })

    it('clears the stored token from state and becomes anonymous after a getMe 401', () => {
        const state = authReducer(initialAuthState(token), { type: 'failed', message: 'authentication required', expired: true })
        expect(state).toEqual({ status: 'anonymous', token: null, user: null, pending: null, error: 'authentication required' })
    })

    it('keeps a stored token and exposes a network error so restoration can be retried', () => {
        const pending = authReducer(initialAuthState(token), { type: 'start', operation: 'restore' })
        const failed = authReducer(pending, { type: 'failed', message: 'Failed to fetch', expired: false })
        expect(failed).toEqual({ status: 'loading', token, user: null, pending: null, error: 'Failed to fetch' })
        expect(authReducer(failed, { type: 'start', operation: 'restore' })).toMatchObject({ pending: 'restore', error: null, token })
    })

    it.each(['login', 'register'] as const)('authenticates and keeps the returned token after %s succeeds', operation => {
        const pending = authReducer(initialAuthState(null), { type: 'start', operation })
        expect(authReducer(pending, { type: 'authenticated', token, user })).toEqual(authenticated)
    })

    it('keeps login failure anonymous and exposes the server message', () => {
        const pending = authReducer(initialAuthState(null), { type: 'start', operation: 'login' })
        expect(authReducer(pending, { type: 'failed', message: 'invalid name or password', expired: false })).toEqual({
            status: 'anonymous', token: null, user: null, pending: null, error: 'invalid name or password'
        })
    })

    it('updates the user name and keeps the token after rename succeeds', () => {
        const renamed = { ...user, name: 'renamed' }
        const pending = authReducer(authenticated, { type: 'start', operation: 'rename' })
        expect(authReducer(pending, { type: 'renamed', user: renamed })).toEqual({ ...authenticated, user: renamed })
        expect(authenticated.user?.name).toBe('viewer')
    })

    it('keeps the user and token and shows the message after a rename conflict', () => {
        expect(authReducer(authenticated, { type: 'failed', message: 'name already taken', expired: false })).toEqual({
            ...authenticated, error: 'name already taken'
        })
    })

    it('logs out and exposes the server message after a rename 401', () => {
        expect(authReducer(authenticated, { type: 'failed', message: 'authentication required', expired: true })).toEqual({
            ...initialAuthState(null), error: 'authentication required'
        })
    })

    it.each(['logout', 'deleted'] as const)('clears the user, token, pending request and error on %s', type => {
        expect(authReducer({ ...authenticated, pending: 'delete', error: 'old error' }, { type })).toEqual(initialAuthState(null))
    })
})
