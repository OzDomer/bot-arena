import type { NextFunction, Request, Response } from "express";
import HttpError from "../errors/HttpError";

export default function notFound(_req: Request, _res: Response, next: NextFunction) {
    const err = new HttpError(404, 'not found')
    next(err)
}