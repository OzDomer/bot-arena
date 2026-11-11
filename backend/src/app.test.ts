import { describe, expect, it, vi } from 'vitest'
import app from './app.ts'
import request from 'supertest'
import errorResponder from './middlewares/error/errorResponder.ts'
import express from 'express'
import logError from './middlewares/error/logError.ts'
import { env } from './config/env.ts'

describe('GET /health', () => {
    it('should return 200 OK and a status object', async () => {
        const response = await request(app).get('/health')

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({ healthy: 'bery' })
    })
})

describe('cors', () => {
    it('allows the configured frontend origin', async () => {
        const response = await request(app).get('/health').set('Origin', env.CORS_ORIGIN)

        expect(response.headers['access-control-allow-origin']).toBe(env.CORS_ORIGIN)
    })

    it('never answers with a wildcard or echoes another origin', async () => {
        const response = await request(app).get('/health').set('Origin', 'https://evil.example')

        expect(response.headers['access-control-allow-origin']).toBe(env.CORS_ORIGIN)
    })

    it('answers a preflight for a JSON request', async () => {
        const response = await request(app)
            .options('/live')
            .set('Origin', env.CORS_ORIGIN)
            .set('Access-Control-Request-Method', 'GET')
            .set('Access-Control-Request-Headers', 'authorization,content-type')

        expect(response.statusCode).toBe(204)
        expect(response.headers['access-control-allow-origin']).toBe(env.CORS_ORIGIN)
        expect(response.headers['access-control-allow-headers']).toBe('authorization,content-type')
    })

    it('does not advertise the framework', async () => {
        const response = await request(app).get('/health')

        expect(response.headers).not.toHaveProperty('x-powered-by')
    })
})

describe('GET / not a declared end point', () => {
    it('should return a not found', async () => {
        const response = await request(app).get('/bad')

        expect(response.statusCode).toBe(404)
        expect(response.body).toEqual({ message: 'not found' })
    })
})

describe('GET /live', () => {
    it('answers with an empty snapshot before any match exists', async () => {
        const response = await request(app).get('/live')

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
            now: expect.any(String),
            msPerTurn: 150,
            current: null,
            next: null,
        })
        expect(Number.isNaN(Date.parse(response.body.now))).toBe(false)
    })
})

describe('GET /matches/:id with a malformed id', () => {
    it.each(['abc', '0', '-1', '1.5', '1e3', '2147483648'])('rejects %s', async (id) => {
        const response = await request(app).get(`/matches/${id}`)

        expect(response.statusCode).toBe(400)
        expect(response.body).toEqual({ message: 'invalid match id' })
    })
})

describe('trust proxy', () => {
    it('is the hop count from env, not the Express default', () => {
        expect(app.get('trust proxy')).toBe(env.TRUST_PROXY_HOPS)
        expect(env.TRUST_PROXY_HOPS).toBe(0)
    })
})

describe('auth rate limit', () => {
    it('answers the 21st /auth request with a 429 the browser can read and leaves other routes alone', async () => {
        const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
        for (let i = 0; i < 20; i++) {
            const response = await request(app).post('/auth/login').send({})
            expect(response.statusCode).toBe(400)
        }
        logged.mockRestore()

        const limited = await request(app).post('/auth/register').set('Origin', env.CORS_ORIGIN).send({})
        expect(limited.statusCode).toBe(429)
        expect(limited.body).toEqual({ message: 'too many attempts, try again later' })
        expect(limited.headers['access-control-allow-origin']).toBe(env.CORS_ORIGIN)

        for (const path of ['/health', '/live']) {
            const response = await request(app).get(path)
            expect(response.statusCode).toBe(200)
        }
    })
})

describe('unexpected errors', () => {
    it('should return a generic 500 and not leak the stack', async () => {
        const testApp = express()

        testApp.get('/crash', () => {
            throw new Error('omg its dying')
        })
        testApp.use(logError)
        testApp.use(errorResponder)

        const response = await request(testApp).get('/crash')

        expect(response.status).toBe(500)
        expect(response.text).not.toContain(`omg its dying`)
        expect(response.body).toEqual({ message: `something unexpected happened please contact our support team` })
    })

})