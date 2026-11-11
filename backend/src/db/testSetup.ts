import { afterAll, beforeAll, beforeEach, vi } from "vitest"
import type { NextFunction, Request, Response } from "express"
import { runMigrations } from "./migrate.ts"
import { db, pool } from "./client.ts"

// these files send more auth requests from one address than the limit allows; the limiter has its own tests
vi.mock("../middlewares/authLimiter.ts", () => ({
    default: (_req: Request, _res: Response, next: NextFunction) => next(),
}))

beforeAll(async () => await runMigrations())

beforeEach(async () => {
    await db.execute(
        "TRUNCATE lineups, matches, users RESTART IDENTITY CASCADE"
    )
})

afterAll(() => pool.end())