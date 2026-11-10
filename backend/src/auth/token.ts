import jwt from 'jsonwebtoken'
import { env } from '../config/env.ts'

const POSTGRES_INT_MAX = 2_147_483_647

export function signToken(userId: number): string {
    return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '7d',
        noTimestamp: true,
    })
}

export function verifyToken(token: string): number {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || !/^[1-9]\d*$/.test(payload.sub)) {
        throw new Error('invalid token subject')
    }

    const id = Number(payload.sub)
    if (!Number.isSafeInteger(id) || id > POSTGRES_INT_MAX) {
        throw new Error('invalid token subject')
    }
    return id
}
