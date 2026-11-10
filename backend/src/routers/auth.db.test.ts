import { describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import request from 'supertest'
import type { Response } from 'supertest'
import app from '../app.ts'
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

describe('POST /auth/register', () => {
    it('returns 201 with a public user, default credits, a working token and a stored bcrypt hash', async () => {
        const response = await checked(request(app).post('/auth/register').send(credentials))
        const [row] = await db.select().from(users)

        expect(response.status).toBe(201)
        expect(Object.keys(response.body).sort()).toEqual(['token', 'user'])
        expect(response.body.token).toEqual(expect.any(String))
        expect(response.body.user).toEqual({
            id: row.id,
            name: credentials.name,
            credits: 1000,
            createdAt: row.createdAt.toISOString(),
        })
        expect(row.passwordHash).not.toBe(credentials.password)
        expect(await bcrypt.compare(credentials.password, row.passwordHash)).toBe(true)

        const me = await checked(request(app).get('/me').set('Authorization', `Bearer ${response.body.token}`))

        expect(me.status).toBe(200)
        expect(me.body).toEqual(response.body.user)
    })

    it.each(['MiXeD_1', 'mixed_1'])('rejects the duplicate name %s with 409 and keeps one row', async (name) => {
        const first = await checked(request(app).post('/auth/register').send(credentials))
        expect(first.status).toBe(201)

        const duplicate = await checked(request(app).post('/auth/register').send({ ...credentials, name }))

        expect(duplicate.status).toBe(409)
        expect(duplicate.body).toEqual({ message: 'name already taken' })
        expect(await db.select().from(users)).toHaveLength(1)
    })

    it('allows exactly one of two concurrent registrations of the same case-insensitive name', async () => {
        const responses = await Promise.all([
            checked(request(app).post('/auth/register').send(credentials)),
            checked(request(app).post('/auth/register').send({ ...credentials, name: 'mixed_1' })),
        ])

        expect(responses.map((response) => response.status).sort()).toEqual([201, 409])
        expect(responses.find((response) => response.status === 409)?.body).toEqual({ message: 'name already taken' })
        expect(await db.select().from(users)).toHaveLength(1)
    })

    it.each([
        { field: 'name', body: { ...credentials, name: 'ab' } },
        { field: 'name', body: { ...credentials, name: 'invalid-name' } },
        { field: 'password', body: { ...credentials, password: 'short' } },
        { field: 'password', body: { ...credentials, password: 'é'.repeat(72) } },
    ])('rejects an invalid $field with 400 and inserts no row', async ({ field, body }) => {
        const response = await checked(request(app).post('/auth/register').send(body))

        expect(response.status).toBe(400)
        expect(response.body).toEqual({ message: expect.stringContaining(field) })
        expect(await db.select().from(users)).toHaveLength(0)
    })

    it('ignores unknown body keys and uses the database credit default', async () => {
        const response = await checked(request(app).post('/auth/register').send({
            ...credentials,
            id: 500,
            credits: 9999,
            passwordHash: 'injected',
            password_hash: 'injected',
            createdAt: '2000-01-01T00:00:00Z',
        }))
        const [row] = await db.select().from(users)

        expect(response.status).toBe(201)
        expect(row.id).toBe(1)
        expect(row.credits).toBe(1000)
        expect(row.passwordHash).not.toBe('injected')
        expect(await bcrypt.compare(credentials.password, row.passwordHash)).toBe(true)
        expect(row.createdAt.toISOString()).toBe(response.body.user.createdAt)
        expect(row.createdAt.toISOString()).not.toBe('2000-01-01T00:00:00.000Z')
    })
})

describe('POST /auth/login', () => {
    it.each(['MiXeD_1', 'mixed_1'])('logs in as %s with 200 and a working token without changing name casing', async (name) => {
        const registered = await checked(request(app).post('/auth/register').send(credentials))
        expect(registered.status).toBe(201)

        const response = await checked(request(app).post('/auth/login').send({ ...credentials, name }))

        expect(response.status).toBe(200)
        expect(Object.keys(response.body).sort()).toEqual(['token', 'user'])
        expect(response.body.user).toEqual(registered.body.user)

        const me = await checked(request(app).get('/me').set('Authorization', `Bearer ${response.body.token}`))

        expect(me.status).toBe(200)
        expect(me.body).toEqual(registered.body.user)
    })

    it('answers the same 401 body for a wrong password and an unknown name', async () => {
        const registered = await checked(request(app).post('/auth/register').send(credentials))
        expect(registered.status).toBe(201)

        const wrongPassword = await checked(request(app).post('/auth/login').send({ ...credentials, password: 'wrong_password' }))
        const unknownName = await checked(request(app).post('/auth/login').send({ ...credentials, name: 'Unknown' }))

        expect(wrongPassword.status).toBe(401)
        expect(unknownName.status).toBe(401)
        expect(wrongPassword.body).toEqual({ message: 'invalid name or password' })
        expect(unknownName.body).toEqual(wrongPassword.body)
    })

    it('runs exactly one bcrypt comparison for an unknown name', async () => {
        const compare = vi.spyOn(bcrypt, 'compare')
        try {
            const response = await checked(request(app).post('/auth/login').send(credentials))

            expect(response.status).toBe(401)
            expect(response.body).toEqual({ message: 'invalid name or password' })
            expect(compare).toHaveBeenCalledTimes(1)
            expect(bcrypt.getRounds(compare.mock.calls[0][1])).toBe(10)
        } finally {
            compare.mockRestore()
        }
    })

    it.each([
        { field: 'name', body: { ...credentials, name: 'ab' } },
        { field: 'password', body: { ...credentials, password: 'short' } },
    ])('rejects an invalid $field with 400', async ({ field, body }) => {
        const response = await checked(request(app).post('/auth/login').send(body))

        expect(response.status).toBe(400)
        expect(response.body).toEqual({ message: expect.stringContaining(field) })
    })

    it('returns 400 invalid JSON body for malformed JSON', async () => {
        const response = await checked(request(app).post('/auth/login')
            .set('Content-Type', 'application/json')
            .send('{"name":"MiXeD_1","password":'))

        expect(response.status).toBe(400)
        expect(response.body).toEqual({ message: 'invalid JSON body' })
    })
})
