import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '../config/env.ts'
import { signToken, verifyToken } from './token.ts'

describe('tokens', () => {
    afterEach(() => vi.useRealTimers())

    it('signs with HS256, carries only the string subject and a seven-day expiry and verifies the id', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

        const token = signToken(42)

        expect(verifyToken(token)).toBe(42)
        expect(jwt.decode(token, { complete: true })?.header.alg).toBe('HS256')
        expect(jwt.decode(token)).toEqual({ sub: '42', exp: Date.now() / 1000 + 7 * 24 * 60 * 60 })
    })

    it('rejects a token whose payload was tampered with', () => {
        const [header, , signature] = signToken(42).split('.')
        const payload = Buffer.from(JSON.stringify({ sub: '43' })).toString('base64url')

        expect(() => verifyToken(`${header}.${payload}.${signature}`)).toThrow()
    })

    it('rejects a token signed with another secret', () => {
        const token = jwt.sign({ sub: '42' }, randomBytes(32), { algorithm: 'HS256' })

        expect(() => verifyToken(token)).toThrow()
    })

    it('rejects a token at its expiry', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
        const token = signToken(42)

        vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000)

        expect(() => verifyToken(token)).toThrow()
    })

    it('rejects an unsigned token with alg none', () => {
        const token = jwt.sign({ sub: '42' }, null, { algorithm: 'none' })

        expect(() => verifyToken(token)).toThrow()
    })

    it.each(['HS512', 'HS384'] as const)('rejects an unexpired %s token with a valid subject and the configured secret', (algorithm) => {
        const token = jwt.sign({ sub: '42' }, env.JWT_SECRET, { algorithm, expiresIn: '1h' })

        expect(() => verifyToken(token)).toThrow()
    })

    it.each([
        undefined, 42, '', '0', '-1', '1.5', '1e3', ' 1', '1 ', '01', 'abc', '2147483648', '9007199254740993',
    ])('rejects a subject that cannot identify a user: %s', (sub) => {
        const token = jwt.sign({ sub }, env.JWT_SECRET, { algorithm: 'HS256' })

        expect(() => verifyToken(token)).toThrow()
    })

    it('accepts the largest Postgres integer subject', () => {
        expect(verifyToken(signToken(2_147_483_647))).toBe(2_147_483_647)
    })

    it('rejects a malformed token', () => {
        expect(() => verifyToken('garbage')).toThrow()
    })
})
