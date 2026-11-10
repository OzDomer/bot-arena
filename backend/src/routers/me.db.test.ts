import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import type { Response } from 'supertest'
import app from '../app.ts'
import { env } from '../config/env.ts'
import { db } from '../db/client.ts'
import { users } from '../db/schema.ts'

const credentials = { name: 'MiXeD_1', password: 'correct_password' }

async function checked(responsePromise: PromiseLike<Response>): Promise<Response> {
    const response = await responsePromise
    const rows = await db.select({ passwordHash: users.passwordHash }).from(users)
    for (const privateValue of ['passwordHash', 'password_hash', ...rows.map((row) => row.passwordHash)]) {
        expect(response.text).not.toContain(privateValue)
    }
    return response
}

async function register(name = credentials.name) {
    const response = await checked(request(app).post('/auth/register').send({ ...credentials, name }))
    expect(response.status).toBe(201)
    return response
}

describe('GET /me', () => {
    it('returns exactly id, name, credits and createdAt for the authenticated user', async () => {
        const registered = await register()
        const [row] = await db.select().from(users)

        const response = await checked(request(app).get('/me').set('Authorization', `Bearer ${registered.body.token}`))

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            id: row.id,
            name: row.name,
            credits: row.credits,
            createdAt: row.createdAt.toISOString(),
        })
        expect(Object.keys(response.body).sort()).toEqual(['createdAt', 'credits', 'id', 'name'])
    })

    it('returns 401 authentication required without an Authorization header', async () => {
        const response = await checked(request(app).get('/me'))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
    })

    it.each(['Bearer garbage', 'Bearer', 'Bearer token extra', 'Basic dXNlcjpwYXNz'])
        ('returns 401 authentication required for Authorization: %s', async (authorization) => {
            const response = await checked(request(app).get('/me').set('Authorization', authorization))

            expect(response.status).toBe(401)
            expect(response.body).toEqual({ message: 'authentication required' })
        })

    it('returns 401 authentication required for a token signed with another secret', async () => {
        const registered = await register()
        const token = jwt.sign({ sub: String(registered.body.user.id) }, randomBytes(32), { algorithm: 'HS256' })

        const response = await checked(request(app).get('/me').set('Authorization', `Bearer ${token}`))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
    })

    it('returns 401 authentication required for an expired token', async () => {
        const registered = await register()
        const token = jwt.sign({ sub: String(registered.body.user.id) }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: -1 })

        const response = await checked(request(app).get('/me').set('Authorization', `Bearer ${token}`))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
    })

    it('returns 401 authentication required for a tampered token', async () => {
        const registered = await register()
        const [header, , signature] = registered.body.token.split('.')
        const payload = Buffer.from(JSON.stringify({ sub: '999999' })).toString('base64url')

        const response = await checked(request(app).get('/me').set('Authorization', `Bearer ${header}.${payload}.${signature}`))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
    })

    it('returns 401 authentication required for a token with alg none', async () => {
        const registered = await register()
        const token = jwt.sign({ sub: String(registered.body.user.id) }, null, { algorithm: 'none' })

        const response = await checked(request(app).get('/me').set('Authorization', `Bearer ${token}`))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
    })

    it.each([undefined, 1, '', '0', '-1', '1.5', '1e3', '01', 'abc', '2147483648'])
        ('returns 401 authentication required for an invalid subject: %s', async (sub) => {
            const token = jwt.sign({ sub }, env.JWT_SECRET, { algorithm: 'HS256' })

            const response = await checked(request(app).get('/me').set('Authorization', `Bearer ${token}`))

            expect(response.status).toBe(401)
            expect(response.body).toEqual({ message: 'authentication required' })
        })

    it('returns 401 authentication required for a subject with no user row', async () => {
        const token = jwt.sign({ sub: '999999' }, env.JWT_SECRET, { algorithm: 'HS256' })

        const response = await checked(request(app).get('/me').set('Authorization', `Bearer ${token}`))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
    })
})

describe('PATCH /me', () => {
    it('renames the user and keeps the old token working with the same id', async () => {
        const registered = await register()
        const authorization = `Bearer ${registered.body.token}`

        const response = await checked(request(app).patch('/me').set('Authorization', authorization).send({ name: 'New_Name' }))

        expect(response.status).toBe(200)
        expect(response.body).toEqual({ ...registered.body.user, name: 'New_Name' })
        const me = await checked(request(app).get('/me').set('Authorization', authorization))
        expect(me.status).toBe(200)
        expect(me.body).toEqual(response.body)

        const [row] = await db.select().from(users)
        expect(row.name).toBe('New_Name')
    })

    it.each(['Other_User', 'other_user'])('rejects the duplicate name %s with 409 and keeps the old name', async (name) => {
        const registered = await register()
        await register('Other_User')
        const authorization = `Bearer ${registered.body.token}`

        const response = await checked(request(app).patch('/me').set('Authorization', authorization).send({ name }))

        expect(response.status).toBe(409)
        expect(response.body).toEqual({ message: 'name already taken' })
        const me = await checked(request(app).get('/me').set('Authorization', authorization))
        expect(me.status).toBe(200)
        expect(me.body).toEqual(registered.body.user)
    })

    it('allows a case-only change of the authenticated user name', async () => {
        const registered = await register()

        const response = await checked(request(app).patch('/me')
            .set('Authorization', `Bearer ${registered.body.token}`).send({ name: 'mixed_1' }))

        expect(response.status).toBe(200)
        expect(response.body).toEqual({ ...registered.body.user, name: 'mixed_1' })
        const [row] = await db.select().from(users)
        expect(row.name).toBe('mixed_1')
    })

    it('allows exactly one of two concurrent renames to the same case-insensitive name', async () => {
        const first = await register('First_User')
        const second = await register('Second_User')

        const responses = await Promise.all([
            checked(request(app).patch('/me').set('Authorization', `Bearer ${first.body.token}`).send({ name: 'Shared_Name' })),
            checked(request(app).patch('/me').set('Authorization', `Bearer ${second.body.token}`).send({ name: 'shared_name' })),
        ])

        expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
        expect(responses.find((response) => response.status === 409)?.body).toEqual({ message: 'name already taken' })
        const rows = await db.select().from(users)
        expect(rows.filter((row) => row.name.toLowerCase() === 'shared_name')).toHaveLength(1)
    })

    it.each(['ab', 'invalid-name', 'a'.repeat(21)])('rejects the invalid name %s with 400 and keeps the old name', async (name) => {
        const registered = await register()
        const authorization = `Bearer ${registered.body.token}`

        const response = await checked(request(app).patch('/me').set('Authorization', authorization).send({ name }))

        expect(response.status).toBe(400)
        expect(response.body).toEqual({ message: expect.stringContaining('name') })
        const me = await checked(request(app).get('/me').set('Authorization', authorization))
        expect(me.status).toBe(200)
        expect(me.body).toEqual(registered.body.user)
    })

    it('ignores unknown keys and preserves the password hash, credits and creation time', async () => {
        const registered = await register()
        const [before] = await db.select().from(users)

        const response = await checked(request(app).patch('/me').set('Authorization', `Bearer ${registered.body.token}`).send({
            name: 'New_Name',
            password: 'replacement_password',
            passwordHash: 'injected',
            credits: 9999,
            createdAt: '2000-01-01T00:00:00Z',
        }))

        expect(response.status).toBe(200)
        expect(response.body).toEqual({ ...registered.body.user, name: 'New_Name' })
        const [after] = await db.select().from(users)
        expect(after).toEqual({ ...before, name: 'New_Name' })
    })

    it('returns 401 authentication required without a token', async () => {
        const response = await checked(request(app).patch('/me').send({ name: 'New_Name' }))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
    })
})

describe('DELETE /me', () => {
    it('returns an empty 204, deletes the row, rejects the old token and allows registering the name again', async () => {
        const registered = await register()
        const authorization = `Bearer ${registered.body.token}`

        const response = await checked(request(app).delete('/me').set('Authorization', authorization))

        expect(response.status).toBe(204)
        expect(response.text).toBe('')
        expect(await db.select().from(users)).toHaveLength(0)

        const deleted = await checked(request(app).get('/me').set('Authorization', authorization))
        expect(deleted.status).toBe(401)
        expect(deleted.body).toEqual({ message: 'authentication required' })

        const replacement = await register('mixed_1')
        expect(replacement.body.user.id).not.toBe(registered.body.user.id)
        const stillDeleted = await checked(request(app).get('/me').set('Authorization', authorization))
        expect(stillDeleted.status).toBe(401)
        expect(stillDeleted.body).toEqual({ message: 'authentication required' })
    })

    it('returns 401 authentication required without a token and keeps the user row', async () => {
        await register()

        const response = await checked(request(app).delete('/me'))

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: 'authentication required' })
        expect(await db.select().from(users)).toHaveLength(1)
    })
})

describe('public routes', () => {
    it.each(['/health', '/live'])('keeps GET %s public without a token', async (path) => {
        const response = await checked(request(app).get(path))

        expect(response.status).toBe(200)
    })
})
