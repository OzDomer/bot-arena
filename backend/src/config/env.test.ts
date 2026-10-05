import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

describe('envSchema', () => {
    it('missing port gives the default', () => {
        const env = parseEnv({})
        expect(env.PORT).toBe(3000)
    })

    it('missing NODE_ENV gives the default', () => {
        const env = parseEnv({})
        expect(env.NODE_ENV).toBe("development")
    })

    it('unknown env rejected', () => {
        expect(() => parseEnv({ NODE_ENV: "staging" })).toThrow("NODE_ENV")
    })

    it('a valid enum value passes through', () => {
        const env = parseEnv({ NODE_ENV: "production" })
        expect(env.NODE_ENV).toBe("production")
    })

    it('zod coercion works', () => {
        const env = parseEnv({ PORT: "3001" })
        expect(env.PORT).toBe(3001)
    })

    it('reject a port that contains a letter', () => {
        expect(() => parseEnv({ PORT: "abc" })).toThrow("PORT")
    })

    it('reject a port that is init but empty', () => {
        expect(() => parseEnv({ PORT: "" })).toThrow("PORT")
    })
    it('port lower bound inclusive', () => {
        const env = parseEnv({ PORT: "1024" })
        expect(env.PORT).toBe(1024)
    })

    it('port upper bound inclusive', () => {
        const env = parseEnv({ PORT: "65535" })
        expect(env.PORT).toBe(65535)
    })

    it('port lower bound edges throw', () => {
        expect(() => parseEnv({ PORT: "1023" })).toThrow("PORT")
    })

    it('port upper outer bound edges throw', () => {
        expect(() => parseEnv({ PORT: "65536" })).toThrow("PORT")
    })
    it('port does not except decimals', () => {
        expect(() => parseEnv({ PORT: "3000.5" })).toThrow("PORT")
    })
})