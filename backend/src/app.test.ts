import { describe, expect, it } from 'vitest'
import app from './app'
import request from 'supertest'
import errorResponder from './middlewares/error/errorResponder'
import express from 'express'
import logError from './middlewares/error/logError'

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