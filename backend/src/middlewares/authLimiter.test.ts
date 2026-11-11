import { describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

const LIMIT = 20

// the limiter is one instance with one store, so every test loads its own
async function limitedApp(trustProxyHops: number) {
    vi.resetModules()
    const { default: authLimiter } = await import('./authLimiter.ts')
    const testApp = express()
    testApp.set('trust proxy', trustProxyHops)
    testApp.use('/auth', authLimiter)
    testApp.post('/auth/login', (_req, res) => res.sendStatus(204))
    return testApp
}

function attempt(testApp: express.Express, forwardedFor?: string) {
    const attempted = request(testApp).post('/auth/login')
    return forwardedFor ? attempted.set('X-Forwarded-For', forwardedFor) : attempted
}

describe('authLimiter', () => {
    it('answers request 21 inside the window with 429 and the message body', async () => {
        const testApp = await limitedApp(0)

        for (let i = 0; i < LIMIT; i++) {
            expect((await attempt(testApp)).status).toBe(204)
        }
        const response = await attempt(testApp)

        expect(response.status).toBe(429)
        expect(response.body).toEqual({ message: 'too many attempts, try again later' })
    })

    it('sends the standard RateLimit headers and not the legacy ones', async () => {
        const response = await attempt(await limitedApp(0))

        expect(response.headers['ratelimit']).toContain('r=19')
        expect(response.headers['ratelimit-policy']).toContain('q=20; w=900')
        expect(response.headers).not.toHaveProperty('x-ratelimit-limit')
        expect(response.headers).not.toHaveProperty('x-ratelimit-remaining')
    })

    it('does not count one client address against another', async () => {
        const testApp = await limitedApp(1)

        for (let i = 0; i < LIMIT; i++) await attempt(testApp, '203.0.113.1')

        expect((await attempt(testApp, '203.0.113.1')).status).toBe(429)
        expect((await attempt(testApp, '203.0.113.2')).status).toBe(204)
    })

    it('with trust proxy 1 keys the count on the address the proxy appended to X-Forwarded-For', async () => {
        const testApp = await limitedApp(1)

        for (let i = 0; i < LIMIT; i++) {
            expect((await attempt(testApp, `198.51.100.${i}, 203.0.113.7`)).status).toBe(204)
        }

        expect((await attempt(testApp, '198.51.100.99, 203.0.113.7')).status).toBe(429)
    })

    it('with trust proxy 0 ignores X-Forwarded-For, so a client cannot pick its own key', async () => {
        const testApp = await limitedApp(0)

        for (let i = 0; i < LIMIT; i++) {
            expect((await attempt(testApp, `203.0.113.${i}`)).status).toBe(204)
        }

        expect((await attempt(testApp, '203.0.113.99')).status).toBe(429)
    })
})
