import { describe, expect, it } from 'vitest'
import { parseEnv } from './env.ts'


const testUrlDb = "postgres://user:password@localhost:5432/dbname"
const base = {
    DATABASE_URL: testUrlDb,
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_SECRET: 'test-secret-test-secret-test-secret-0123',
}
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
        expect(() => parseEnv({ NODE_ENV: "staging", ...base })).toThrow("NODE_ENV")
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
        expect(() => parseEnv({ PORT: "abc", ...base })).toThrow("PORT")
    })

    it('rejects an empty PORT', () => {
        expect(() => parseEnv({ PORT: "", ...base })).toThrow("PORT")
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
        expect(() => parseEnv({ PORT: "1023", ...base })).toThrow("PORT")
    })

    it('port upper outer bound edges throw', () => {
        expect(() => parseEnv({ PORT: "65536", ...base })).toThrow("PORT")
    })
    it('port does not accept decimals', () => {
        expect(() => parseEnv({ PORT: "3000.5", ...base })).toThrow("PORT")
    })
    it('valid database url', () => {
        const env = parseEnv(base)
        expect(env.DATABASE_URL).toBe(testUrlDb)
    })
    it('accept a postgresql database url', () => {
        const postgresqlurl = "postgresql://user:password@localhost:5432/dbname"
        const env = parseEnv({ ...base, DATABASE_URL: postgresqlurl })
        expect(env.DATABASE_URL).toBe(postgresqlurl)
    })
    it('rejects missing db url', () => {
        expect(() => parseEnv({ ...base, DATABASE_URL: undefined })).toThrow("DATABASE_URL")
    })
    it('rejects an http:// url db', () => {
        expect(() => parseEnv({ ...base, DATABASE_URL: "http://url.com" })).toThrow("DATABASE_URL")
    })
    it('rejects an non url db url', () => {
        expect(() => parseEnv({ ...base, DATABASE_URL: "abc" })).toThrow("DATABASE_URL")
    })

    // CORS_ORIGIN tests
    it('accepts http://localhost:5173 for CORS_ORIGIN', () => {
        const env = parseEnv({ ...base, CORS_ORIGIN: 'http://localhost:5173' })
        expect(env.CORS_ORIGIN).toBe('http://localhost:5173')
    })

    it('accepts https origin without port', () => {
        const env = parseEnv({ ...base, CORS_ORIGIN: 'https://arena.example.com' })
        expect(env.CORS_ORIGIN).toBe('https://arena.example.com')
    })

    it('rejects missing CORS_ORIGIN', () => {
        const withoutCors = { ...base, CORS_ORIGIN: undefined }
        expect(() => parseEnv(withoutCors)).toThrow("CORS_ORIGIN")
    })

    it('rejects * for CORS_ORIGIN', () => {
        expect(() => parseEnv({ ...base, CORS_ORIGIN: '*' })).toThrow("CORS_ORIGIN")
    })

    it('rejects a non-URL string for CORS_ORIGIN', () => {
        expect(() => parseEnv({ ...base, CORS_ORIGIN: 'not-a-url' })).toThrow("CORS_ORIGIN")
    })

    it('rejects a non-http scheme for CORS_ORIGIN', () => {
        expect(() => parseEnv({ ...base, CORS_ORIGIN: 'ftp://example.com' })).toThrow("CORS_ORIGIN")
    })

    it('rejects a trailing slash for CORS_ORIGIN', () => {
        expect(() => parseEnv({ ...base, CORS_ORIGIN: 'http://localhost:5173/' })).toThrow("CORS_ORIGIN")
    })

    it('rejects a path for CORS_ORIGIN', () => {
        expect(() => parseEnv({ ...base, CORS_ORIGIN: 'http://localhost:5173/app' })).toThrow("CORS_ORIGIN")
    })

    // JWT_SECRET tests
    it('accepts a 32-character secret', () => {
        const secret = 'x'.repeat(32)
        const env = parseEnv({ ...base, JWT_SECRET: secret })
        expect(env.JWT_SECRET).toBe(secret)
    })

    it('rejects a 31-character secret', () => {
        expect(() => parseEnv({ ...base, JWT_SECRET: 'x'.repeat(31) })).toThrow("JWT_SECRET")
    })

    it('rejects missing JWT_SECRET', () => {
        const withoutJwt = { ...base, JWT_SECRET: undefined }
        expect(() => parseEnv(withoutJwt)).toThrow("JWT_SECRET")
    })

    it('rejects an empty JWT_SECRET', () => {
        expect(() => parseEnv({ ...base, JWT_SECRET: '' })).toThrow("JWT_SECRET")
    })

    // BETTING_WINDOW_MS tests
    it('defaults to 300000 when missing', () => {
        const withoutBetting = { ...base, BETTING_WINDOW_MS: undefined }
        const env = parseEnv(withoutBetting)
        expect(env.BETTING_WINDOW_MS).toBe(300000)
    })

    it('coerces "45000" to the number 45000', () => {
        const env = parseEnv({ ...base, BETTING_WINDOW_MS: '45000' })
        expect(env.BETTING_WINDOW_MS).toBe(45000)
    })

    it('accepts "1000" lower bound', () => {
        const env = parseEnv({ ...base, BETTING_WINDOW_MS: '1000' })
        expect(env.BETTING_WINDOW_MS).toBe(1000)
    })

    it('rejects "999"', () => {
        expect(() => parseEnv({ ...base, BETTING_WINDOW_MS: '999' })).toThrow("BETTING_WINDOW_MS")
    })

    it('rejects a decimal', () => {
        expect(() => parseEnv({ ...base, BETTING_WINDOW_MS: '1500.5' })).toThrow("BETTING_WINDOW_MS")
    })

    it('rejects a non-numeric string', () => {
        expect(() => parseEnv({ ...base, BETTING_WINDOW_MS: 'abc' })).toThrow("BETTING_WINDOW_MS")
    })

    it('rejects an empty string', () => {
        expect(() => parseEnv({ ...base, BETTING_WINDOW_MS: '' })).toThrow("BETTING_WINDOW_MS")
    })

    // TRUST_PROXY_HOPS tests
    it('defaults to 0 hops when missing', () => {
        const env = parseEnv(base)
        expect(env.TRUST_PROXY_HOPS).toBe(0)
    })

    it('coerces "1" to the number 1', () => {
        const env = parseEnv({ ...base, TRUST_PROXY_HOPS: '1' })
        expect(env.TRUST_PROXY_HOPS).toBe(1)
    })

    it('accepts an explicit "0"', () => {
        const env = parseEnv({ ...base, TRUST_PROXY_HOPS: '0' })
        expect(env.TRUST_PROXY_HOPS).toBe(0)
    })

    it('accepts "5" upper bound', () => {
        const env = parseEnv({ ...base, TRUST_PROXY_HOPS: '5' })
        expect(env.TRUST_PROXY_HOPS).toBe(5)
    })

    it('rejects "6"', () => {
        expect(() => parseEnv({ ...base, TRUST_PROXY_HOPS: '6' })).toThrow("TRUST_PROXY_HOPS")
    })

    it('rejects a negative count', () => {
        expect(() => parseEnv({ ...base, TRUST_PROXY_HOPS: '-1' })).toThrow("TRUST_PROXY_HOPS")
    })

    it('rejects a decimal count', () => {
        expect(() => parseEnv({ ...base, TRUST_PROXY_HOPS: '1.5' })).toThrow("TRUST_PROXY_HOPS")
    })

    it('rejects "true", which Express would read as trust everything', () => {
        expect(() => parseEnv({ ...base, TRUST_PROXY_HOPS: 'true' })).toThrow("TRUST_PROXY_HOPS")
    })
})
