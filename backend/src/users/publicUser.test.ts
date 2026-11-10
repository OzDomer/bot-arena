import { describe, expect, it } from 'vitest'
import { publicUser } from './publicUser.ts'

describe('publicUser', () => {
    it('copies exactly id, name, credits and createdAt from the row', () => {
        const createdAt = new Date('2026-01-01T00:00:00Z')
        const row = { id: 1, name: 'Oz_1', credits: 1000, createdAt, passwordHash: 'stored_hash', extra: 'private' }

        const user = publicUser(row)

        expect(user).toEqual({ id: 1, name: 'Oz_1', credits: 1000, createdAt })
        expect(Object.keys(user).sort()).toEqual(['createdAt', 'credits', 'id', 'name'])
        expect(user).not.toBe(row)
    })
})
