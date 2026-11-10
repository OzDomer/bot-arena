import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../app.ts'
import { ne } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { matches } from '../db/schema.ts'
import { getLive, loadLive, startLive, tick } from '../matches/live.ts'

const T = new Date('2026-01-01T12:00:00Z')

describe('GET /live', () => {
    it('shows the open match and the next one without anything secret', async () => {
        await loadLive()
        await tick(T)
        await tick(new Date(T.getTime() + 1_000))
        const [open, scheduled] = getLive()

        const response = await request(app).get('/live')

        expect(response.statusCode).toBe(200)
        expect(response.body.current).toEqual({
            matchId: open.match.id,
            phase: 'open',
            opensAt: open.match.opensAt.toISOString(),
            closesAt: open.match.closesAt.toISOString(),
            lineup: open.lineup.names,
            preset: 'bigmap',
            simVersion: open.lineup.simVersion,
            odds: open.lineup.odds,
            commitHash: open.match.commitHash,
        })
        expect(response.body.next).toEqual({
            matchId: scheduled.match.id,
            phase: 'scheduled',
            opensAt: scheduled.match.opensAt.toISOString(),
        })

        for (const { match } of [open, scheduled]) {
            expect(response.text).not.toContain(match.secret.toString('hex'))
        }
        expect(response.text).not.toContain(scheduled.match.commitHash)
    })

    it('is already correct right after a boot that found stale rows', async () => {
        await loadLive()
        await tick(T)
        await tick(new Date(T.getTime() + 1_000))
        const staleIds = getLive().map(({ match }) => match.id)

        // the process comes back an hour later, long after both matches ended
        const bootedAt = new Date(T.getTime() + 60 * 60 * 1000)
        await startLive(bootedAt)

        const response = await request(app).get('/live')

        expect(response.statusCode).toBe(200)
        expect(response.body.current).toBeNull()
        expect(response.body.next).toEqual({
            matchId: expect.any(Number),
            phase: 'scheduled',
            opensAt: bootedAt.toISOString(),
        })
        expect(staleIds).not.toContain(response.body.next.matchId)

        const unsettled = await db.select().from(matches).where(ne(matches.phase, 'settled'))
        expect(unsettled.map((match) => match.id)).toEqual([response.body.next.matchId])
    })

    it('resumes the open match after a boot inside its betting window', async () => {
        await loadLive()
        await tick(T)
        await tick(new Date(T.getTime() + 1_000))
        const [open, scheduled] = getLive().map(({ match }) => match.id)

        await startLive(new Date(T.getTime() + 2_000))

        const response = await request(app).get('/live')

        expect(response.body.current).toMatchObject({ matchId: open, phase: 'open' })
        expect(response.body.next).toMatchObject({ matchId: scheduled, phase: 'scheduled' })
    })
})
