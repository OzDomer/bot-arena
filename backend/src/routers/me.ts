import { Router } from 'express'
import type { Response } from 'express'
import { eq } from 'drizzle-orm'
import { parseBody, renameSchema } from '../auth/schemas.ts'
import { db } from '../db/client.ts'
import { isUniqueViolation } from '../db/isUniqueViolation.ts'
import { users } from '../db/schema.ts'
import HttpError from '../errors/HttpError.ts'
import authEnforce from '../middlewares/authEnforce.ts'
import type { AuthLocals } from '../middlewares/authEnforce.ts'
import { publicUser } from '../users/publicUser.ts'

const meRouter = Router()

meRouter.use(authEnforce)

meRouter.get('/', (_req, res: Response<unknown, AuthLocals>) => {
    res.json(publicUser(res.locals.user))
})

meRouter.patch('/', async (req, res: Response<unknown, AuthLocals>) => {
    const { name } = parseBody(renameSchema, req.body)

    let user: typeof users.$inferSelect
    try {
        [user] = await db.update(users).set({ name }).where(eq(users.id, res.locals.user.id)).returning()
    } catch (error) {
        if (isUniqueViolation(error)) throw new HttpError(409, 'name already taken')
        throw error
    }
    if (!user) throw new HttpError(401, 'authentication required')

    res.json(publicUser(user))
})

meRouter.delete('/', async (_req, res: Response<unknown, AuthLocals>) => {
    await db.delete(users).where(eq(users.id, res.locals.user.id))
    res.status(204).end()
})

export default meRouter
