import { afterAll, beforeAll, beforeEach } from "vitest"
import { runMigrations } from "./migrate.ts"
import { db, pool } from "./client.ts"

beforeAll(async () => await runMigrations())

beforeEach(async () => {
    await db.execute(
        "TRUNCATE lineups, matches RESTART IDENTITY CASCADE"
    )
})

afterAll(() => pool.end())