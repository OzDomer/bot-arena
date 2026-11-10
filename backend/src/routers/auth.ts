import { Router } from 'express'
import { eq, sql } from 'drizzle-orm'
import { hashPassword, verifyPassword } from '../auth/password.ts'
import { credentialsSchema, parseBody } from '../auth/schemas.ts'
import { signToken } from '../auth/token.ts'
import { db } from '../db/client.ts'
import { isUniqueViolation } from '../db/isUniqueViolation.ts'
import { users } from '../db/schema.ts'
import HttpError from '../errors/HttpError.ts'
import { publicUser } from '../users/publicUser.ts'

const authRouter = Router()

authRouter.post('/register', async (req, res) => {
    const { name, password } = parseBody(credentialsSchema, req.body)
    const passwordHash = await hashPassword(password)

    let user: typeof users.$inferSelect
    try {
        [user] = await db.insert(users).values({ name, passwordHash }).returning()
    } catch (error) {
        if (isUniqueViolation(error)) throw new HttpError(409, 'name already taken')
        // Drizzle insert errors include parameters, including the password hash.
        throw new Error('could not create user')
    }

    res.status(201).json({ token: signToken(user.id), user: publicUser(user) })
})

authRouter.post('/login', async (req, res) => {
    const { name, password } = parseBody(credentialsSchema, req.body)
    const [user] = await db.select().from(users).where(eq(sql`lower(${users.name})`, name.toLowerCase()))
    const validPassword = await verifyPassword(password, user?.passwordHash)
    if (!user || !validPassword) throw new HttpError(401, 'invalid name or password')

    res.json({ token: signToken(user.id), user: publicUser(user) })
})

export default authRouter
