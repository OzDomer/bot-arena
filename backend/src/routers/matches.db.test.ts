import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import app from '../app.ts'
import { db } from '../db/client.ts'
import { matches } from '../db/schema.ts'
import { getLive, loadLive, tick } from '../matches/live.ts'

const T = new Date('2026-01-01T12:00:00Z')
const HOUR_MS = 60 * 60 * 1000

// one settled match and one that is still scheduled
async function playOneMatch() {
    await loadLive()
    await tick(T)
    const settledId = getLive()[0].match.id
    await tick(new Date(T.getTime() + HOUR_MS))
    const [settled] = await db.select().from(matches).where(eq(matches.id, settledId))
    const unsettled = getLive()[0].match
    return { settled, unsettled }
}

describe('GET /matches/:id', () => {
    it('serves a settled match with its secret and result', async () => {
        const { settled } = await playOneMatch()

        const response = await request(app).get(`/matches/${settled.id}`)

        expect(response.statusCode).toBe(200)
        expect(response.body).toMatchObject({
            matchId: settled.id,
            phase: 'settled',
            commitHash: settled.commitHash,
            secret: settled.secret.toString('hex'),
            startsAt: settled.startsAt!.toISOString(),
            turns: settled.turns,
            winner: settled.winner,
            settledAt: settled.settledAt!.toISOString(),
        })
        expect(response.body.lineup).toHaveLength(8)

        // what the page needs to audit the match: the published secret
        // hashes to the commitment
        const hash = createHash('sha256').update(Buffer.from(response.body.secret, 'hex')).digest('hex')
        expect(hash).toBe(response.body.commitHash)
    })

    it('answers 404 for a match that is not settled yet', async () => {
        const { unsettled } = await playOneMatch()

        const response = await request(app).get(`/matches/${unsettled.id}`)

        expect(response.statusCode).toBe(404)
        expect(response.body).toEqual({ message: 'not found' })
    })

    it('answers 404 for an id that does not exist', async () => {
        const response = await request(app).get('/matches/999999')

        expect(response.statusCode).toBe(404)
        expect(response.body).toEqual({ message: 'not found' })
    })
})
