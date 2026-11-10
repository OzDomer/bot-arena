import { describe, expect, it } from 'vitest'
import app from './app.ts'
import request from 'supertest'
import errorResponder from './middlewares/error/errorResponder.ts'
import express from 'express'
import logError from './middlewares/error/logError.ts'

describe('GET /health', () => {
    it('should return 200 OK and a status object', async () => {
        const response = await request(app).get('/health')

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({ healthy: 'bery' })
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