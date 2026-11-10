import { describe, expect, it } from 'vitest'
import express from 'express'
import request from 'supertest'
import HttpError from '../../errors/HttpError.ts'
import errorResponder from './errorResponder.ts'
import jsonError from './jsonError.ts'
import logError from './logError.ts'

describe('JSON parse errors', () => {
    it('returns 400 invalid JSON body without exposing the body or parser message', async () => {
        const testApp = express()
        testApp.use(express.json())
        testApp.post('/body', (_req, res) => res.sendStatus(204))
        testApp.use(jsonError)
        testApp.use(logError)
        testApp.use(errorResponder)

        const response = await request(testApp).post('/body')
            .set('Content-Type', 'application/json')
            .send('{"password":"private_password",')

        expect(response.status).toBe(400)
        expect(response.body).toEqual({ message: 'invalid JSON body' })
        expect(response.text).not.toContain('private_password')
        expect(response.text).not.toContain('SyntaxError')
    })

    it('preserves an unrelated HttpError status and message', async () => {
        const testApp = express()
        testApp.get('/error', () => { throw new HttpError(409, 'name already taken') })
        testApp.use(jsonError)
        testApp.use(logError)
        testApp.use(errorResponder)

        const response = await request(testApp).get('/error')

        expect(response.status).toBe(409)
        expect(response.body).toEqual({ message: 'name already taken' })
    })

    it('keeps unexpected errors as a generic 500 without leaking their message', async () => {
        const testApp = express()
        testApp.get('/crash', () => { throw new Error('unexpected details') })
        testApp.use(jsonError)
        testApp.use(logError)
        testApp.use(errorResponder)

        const response = await request(testApp).get('/crash')

        expect(response.status).toBe(500)
        expect(response.text).not.toContain('unexpected details')
        expect(response.body).toEqual({ message: 'something unexpected happened please contact our support team' })
    })
})
