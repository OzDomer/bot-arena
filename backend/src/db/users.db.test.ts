import { describe, expect, it } from 'vitest'
import { db } from './client.ts'
import { STARTING_CREDITS, users } from './schema.ts'

const UNIQUE_VIOLATION = '23505'

// drizzle wraps the driver error; the Postgres code is on the cause
async function postgresCodeOf(query: Promise<unknown>): Promise<string | undefined> {
    try {
        await query
        return undefined
    } catch (error) {
        const cause = error instanceof Error ? error.cause : undefined
        return cause instanceof Error && 'code' in cause ? String(cause.code) : undefined
    }
}

describe('users table', () => {
    it('gives a new user the starting credits and a creation time', async () => {
        const [user] = await db.insert(users).values({ name: 'Oz', passwordHash: 'hash' }).returning()

        expect(user.id).toBe(1)
        expect(user.name).toBe('Oz')
        expect(user.credits).toBe(STARTING_CREDITS)
        expect(user.credits).toBe(1000)
        expect(user.createdAt).toBeInstanceOf(Date)
    })

    it('keeps the name as typed', async () => {
        await db.insert(users).values({ name: 'MiXed_Case1', passwordHash: 'hash' })

        const [user] = await db.select().from(users)
        expect(user.name).toBe('MiXed_Case1')
    })

    it('refuses the same name again', async () => {
        await db.insert(users).values({ name: 'Oz', passwordHash: 'hash' })

        const code = await postgresCodeOf(db.insert(users).values({ name: 'Oz', passwordHash: 'other' }))
        expect(code).toBe(UNIQUE_VIOLATION)
    })

    it('refuses a name that differs only by case', async () => {
        await db.insert(users).values({ name: 'Oz', passwordHash: 'hash' })

        const code = await postgresCodeOf(db.insert(users).values({ name: 'oz', passwordHash: 'other' }))
        expect(code).toBe(UNIQUE_VIOLATION)
        expect(await db.select().from(users)).toHaveLength(1)
    })

    it('allows two different names', async () => {
        await db.insert(users).values({ name: 'Oz', passwordHash: 'hash' })
        await db.insert(users).values({ name: 'Oz2', passwordHash: 'hash' })

        expect(await db.select().from(users)).toHaveLength(2)
    })
})
