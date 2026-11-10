import { describe, expect, it } from 'vitest'
import HttpError from '../errors/HttpError.ts'
import { credentialsSchema, parseBody, renameSchema } from './schemas.ts'

const valid = { name: 'Oz_1', password: 'password123' }

describe('credentials validation', () => {
    it.each([3, 20])('accepts a name with %i characters', (length) => {
        expect(parseBody(credentialsSchema, { ...valid, name: 'a'.repeat(length) }).name).toBe('a'.repeat(length))
    })

    it.each([2, 21])('rejects a name with %i characters with a 400 naming the field', (length) => {
        expect(() => parseBody(credentialsSchema, { ...valid, name: 'a'.repeat(length) }))
            .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('name') }))
    })

    it.each(['has space', 'has-dash', 'has.dot', 'naïve', 'name\n', '名字名字', ' a_b'])
        ('rejects a name with invalid characters: %s', (name) => {
            expect(() => parseBody(credentialsSchema, { ...valid, name }))
                .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('name') }))
        })

    it.each([8, 72])('accepts a password with %i ASCII characters', (length) => {
        const password = 'p'.repeat(length)

        expect(parseBody(credentialsSchema, { ...valid, password }).password).toBe(password)
    })

    it.each([7, 73])('rejects a password with %i characters with a 400 naming the field', (length) => {
        expect(() => parseBody(credentialsSchema, { ...valid, password: 'p'.repeat(length) }))
            .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('password') }))
    })

    it('rejects a 72-character password whose UTF-8 encoding exceeds 72 bytes', () => {
        const password = 'é'.repeat(72)

        expect(password).toHaveLength(72)
        expect(Buffer.byteLength(password, 'utf8')).toBe(144)
        expect(() => parseBody(credentialsSchema, { ...valid, password }))
            .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('password') }))
    })

    it('accepts a multibyte password at 72 bytes and rejects one at 73 bytes', () => {
        const password = 'é'.repeat(36)

        expect(parseBody(credentialsSchema, { ...valid, password }).password).toBe(password)
        expect(() => parseBody(credentialsSchema, { ...valid, password: `${password}a` }))
            .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('password') }))
    })

    it.each([
        { name: undefined }, { name: 123 }, { password: undefined }, { password: 123 },
    ])('rejects a missing or non-string field: %j', (fields) => {
        const field = 'name' in fields ? 'name' : 'password'

        expect(() => parseBody(credentialsSchema, { ...valid, ...fields }))
            .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining(field) }))
    })

    it.each([undefined, null, [], 'credentials', 42])('rejects a non-object body: %j', (body) => {
        expect(() => parseBody(credentialsSchema, body)).toThrow(HttpError)
        expect(() => parseBody(credentialsSchema, body))
            .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('name') }))
    })

    it('keeps the name as typed and removes unknown keys', () => {
        expect(parseBody(credentialsSchema, { ...valid, credits: 9999, passwordHash: 'injected' })).toEqual(valid)
    })
})

describe('rename validation', () => {
    it('keeps only the name', () => {
        expect(parseBody(renameSchema, { name: 'MiXeD', password: 'ignored', credits: 9999 }))
            .toEqual({ name: 'MiXeD' })
    })

    it.each(['ab', 'a'.repeat(21), 'bad-name', undefined, 123])('rejects an invalid name: %s', (name) => {
        expect(() => parseBody(renameSchema, { name }))
            .toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('name') }))
    })
})
