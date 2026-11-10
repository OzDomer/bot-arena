import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../app.ts'
import { getLive, loadLive, tick } from '../matches/live.ts'

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
})
