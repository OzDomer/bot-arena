import type { NextFunction, Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../auth/token.ts'
import { db } from '../db/client.ts'
import { users } from '../db/schema.ts'
import HttpError from '../errors/HttpError.ts'

export type AuthLocals = { user: typeof users.$inferSelect }

export default async function authEnforce(req: Request, res: Response<unknown, AuthLocals>, next: NextFunction) {
    const bearer = req.get('Authorization')?.match(/^Bearer (\S+)$/i)
    if (!bearer) throw new HttpError(401, 'authentication required')

    let id: number
    try {
        id = verifyToken(bearer[1])
    } catch {
        throw new HttpError(401, 'authentication required')
    }

    const [user] = await db.select().from(users).where(eq(users.id, id))
    if (!user) throw new HttpError(401, 'authentication required')

    res.locals.user = user
    next()
}
