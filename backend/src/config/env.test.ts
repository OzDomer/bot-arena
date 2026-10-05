import { describe, expect, it } from 'vitest'
import { parseEnv } from './env.ts'


const testUrlDb = "postgres://user:password@localhost:5432/dbname"
const base = { DATABASE_URL: testUrlDb }
describe('parseEnv', () => {
    it('missing port gives the default', () => {
        const env = parseEnv(base)
        expect(env.PORT).toBe(3000)
    })

    it('missing NODE_ENV gives the default', () => {
        const env = parseEnv(base)
        expect(env.NODE_ENV).toBe("development")
    })

    it('unknown env rejected', () => {
        expect(() => parseEnv({ NODE_ENV: "staging" })).toThrow("NODE_ENV")
    })

    it('a valid enum value passes through', () => {
        const env = parseEnv({ NODE_ENV: "production", ...base })
        expect(env.NODE_ENV).toBe("production")
    })

    it('coerces PORT to a number', () => {
        const env = parseEnv({ PORT: "3001", ...base })
        expect(env.PORT).toBe(3001)
    })

    it('reject a port that contains a letter', () => {
        expect(() => parseEnv({ PORT: "abc" })).toThrow("PORT")
    })

    it('rejects an empty PORT', () => {
        expect(() => parseEnv({ PORT: "" })).toThrow("PORT")
    })
    it('port lower bound inclusive', () => {
        const env = parseEnv({ PORT: "1024", ...base })
        expect(env.PORT).toBe(1024)
    })

    it('port upper bound inclusive', () => {
        const env = parseEnv({ PORT: "65535", ...base })
        expect(env.PORT).toBe(65535)
    })

    it('port lower bound edges throw', () => {
        expect(() => parseEnv({ PORT: "1023" })).toThrow("PORT")
    })

    it('port upper outer bound edges throw', () => {
        expect(() => parseEnv({ PORT: "65536" })).toThrow("PORT")
    })
    it('port does not accept decimals', () => {
        expect(() => parseEnv({ PORT: "3000.5" })).toThrow("PORT")
    })
    it('valid database url', () => {
        const env = parseEnv(base)
        expect(env.DATABASE_URL).toBe(testUrlDb)
    })
    it('accept a postgresql database url', () => {
        const postgresqlurl = "postgresql://user:password@localhost:5432/dbname"
        const env = parseEnv({ DATABASE_URL: postgresqlurl })
        expect(env.DATABASE_URL).toBe(postgresqlurl)
    })
    it('rejects missing db url', () => {
        expect(() => parseEnv({})).toThrow("DATABASE_URL")
    })
    it('rejects an http:// url db', () => {
        expect(() => parseEnv({ ...base, DATABASE_URL: "http://url.com" })).toThrow("DATABASE_URL")
    })
    it('rejects an non url db url', () => {
        expect(() => parseEnv({ ...base, DATABASE_URL: "abc" })).toThrow("DATABASE_URL")
    })
})