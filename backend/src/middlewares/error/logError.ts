import type { NextFunction, Request, Response } from "express";
import type HttpError from "../../errors/HttpError.ts";

export default function logError(err: HttpError, _req: Request, _res: Response, next: NextFunction) {
    console.error(err)
    next(err)
}