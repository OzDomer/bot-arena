import * as z from 'zod'
import HttpError from '../errors/HttpError.ts'

const name = z.string({ error: 'name must be a string' })
    .regex(/^[A-Za-z0-9_]{3,20}$/, 'name must be 3 to 20 letters, numbers or underscores')

const password = z.string({ error: 'password must be a string' })
    .min(8, 'password must be at least 8 characters')
    .max(72, 'password must be at most 72 characters')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'password must be at most 72 UTF-8 bytes')

export const credentialsSchema = z.object({ name, password })
export const renameSchema = z.object({ name })

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body)
    if (!result.success) {
        const issue = result.error.issues[0]
        const message = issue.path.length === 0 ? 'name is required in a JSON object' : issue.message
        throw new HttpError(400, message)
    }
    return result.data
}
