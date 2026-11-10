import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../db/client.ts'
import { lineups, matches } from '../db/schema.ts'
import HttpError from '../errors/HttpError.ts'
import { snapshotOf } from '../matches/snapshot.ts'

const POSTGRES_INT_MAX = 2_147_483_647

const matchId = z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(POSTGRES_INT_MAX))

const matchesRouter = Router()

// Only settled matches are served: the phase is part of the query, so a
// row that is still secret never leaves the database through this route.
matchesRouter.get('/:id', async (req, res) => {
    const id = matchId.safeParse(req.params.id)
    if (!id.success) throw new HttpError(400, 'invalid match id')

    const [row] = await db
        .select({ match: matches, lineup: lineups })
        .from(matches)
        .innerJoin(lineups, eq(matches.lineupId, lineups.id))
        .where(and(eq(matches.id, id.data), eq(matches.phase, 'settled')))
    if (!row) throw new HttpError(404, 'not found')

    res.json(snapshotOf(row))
})

export default matchesRouter
