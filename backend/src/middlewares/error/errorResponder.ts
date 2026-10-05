import type { NextFunction, Request, Response } from "express";
import HttpError from "../../errors/HttpError";

export default function errorResponder(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof HttpError){
        res.status(err.status).json({message: err.message})
    }else{
        res.status(500).json({message: `something unexpected happened please contact our support team`})
    }
}

