import type { NextFunction, Request, Response } from 'express'
import HttpError from '../../errors/HttpError.ts'

export default function jsonError(error: unknown, _req: Request, _res: Response, next: NextFunction) {
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed') {
        next(new HttpError(400, 'invalid JSON body'))
        return
    }
    next(error)
}
