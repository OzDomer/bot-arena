import type { users } from '../db/schema.ts'

export function publicUser(user: typeof users.$inferSelect) {
    return {
        id: user.id,
        name: user.name,
        credits: user.credits,
        createdAt: user.createdAt,
    }
}
