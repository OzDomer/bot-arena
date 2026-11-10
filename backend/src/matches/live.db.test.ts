import { describe, expect, it } from 'vitest'
import { eq, ne } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { matches } from '../db/schema.ts'
import { getLive, loadLive, tick } from './live.ts'
import { BETTING_WINDOW_MS } from './createScheduledMatch.ts'
import { MS_PER_TURN, RESULT_HOLD_MS, REVEAL_LEAD_MS } from './nextPhase.ts'
import { liveSnapshotOf } from './snapshot.ts'

const T = new Date('2026-01-01T12:00:00Z')
const after = (ms: number) => new Date(T.getTime() + ms)
const HOUR_MS = 60 * 60 * 1000

async function rowInDb(id: number) {
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    return row
}

const liveIds = () => getLive().map(({ match }) => match.id)

describe('tick', () => {
    it('drives one match through its whole lifecycle and keeps the pipeline full', async () => {
        await loadLive()
        expect(getLive()).toHaveLength(0)

        // empty table: the first tick creates the first match
        expect(await tick(T)).toBe(true)
        expect(getLive()).toHaveLength(1)
        const first = getLive()[0].match
        expect(first.phase).toBe('scheduled')

        // opening it leaves nothing scheduled, so a second one is created
        expect(await tick(after(1_000))).toBe(true)
        expect(first.phase).toBe('open')
        expect(getLive()).toHaveLength(2)
        const second = getLive()[1].match
        expect(second.phase).toBe('scheduled')
        expect((await rowInDb(first.id)).phase).toBe('open')

        // nothing is due: no write, nothing to announce
        expect(await tick(after(2_000))).toBe(false)

        await tick(after(BETTING_WINDOW_MS))
        expect(first.phase).toBe('closed')

        const revealsAt = BETTING_WINDOW_MS + REVEAL_LEAD_MS
        await tick(after(revealsAt))
        expect(first.phase).toBe('revealed')
        expect(first.startsAt).toEqual(after(revealsAt))
        expect((await rowInDb(first.id)).startsAt).toEqual(after(revealsAt))

        const endsAt = revealsAt + first.turns! * MS_PER_TURN
        expect(await tick(after(endsAt))).toBe(true)
        const settled = await rowInDb(first.id)
        expect(settled.phase).toBe('settled')
        expect(settled.settledAt).toEqual(after(endsAt))

        // the result stays on screen: the settled match is still current
        // and the next one has not opened
        expect(second.opensAt).toEqual(after(endsAt + RESULT_HOLD_MS))
        expect(liveIds()).toEqual([first.id, second.id])
        expect(liveSnapshotOf(getLive(), after(endsAt)).current).toMatchObject({ matchId: first.id, phase: 'settled' })

        expect(await tick(after(endsAt + RESULT_HOLD_MS - 1))).toBe(false)
        expect(liveSnapshotOf(getLive(), after(endsAt)).current).toMatchObject({ matchId: first.id, phase: 'settled' })
        expect(second.phase).toBe('scheduled')

        // the hold ends: the settled match leaves and the next one opens
        expect(await tick(after(endsAt + RESULT_HOLD_MS))).toBe(true)
        expect(liveIds()).not.toContain(first.id)
        expect(second.phase).toBe('open')
        expect(liveSnapshotOf(getLive(), after(endsAt)).current).toMatchObject({ matchId: second.id, phase: 'open' })
        expect(getLive()).toHaveLength(2)
        expect(getLive()[1].match.phase).toBe('scheduled')
    })
})

describe('loadLive', () => {
    it('loads unsettled matches with their lineups, oldest first', async () => {
        await loadLive()
        await tick(T)
        await tick(after(1_000))
        const ids = liveIds()
        const lineupIds = getLive().map(({ lineup }) => lineup.id)

        await loadLive()
        expect(liveIds()).toEqual(ids)
        expect(getLive().map(({ lineup }) => lineup.id)).toEqual(lineupIds)
        for (const { match, lineup } of getLive()) {
            expect(lineup.id).toBe(match.lineupId)
            expect(lineup.names).toHaveLength(8)
        }
    })

    it('resumes a match where it was after a restart', async () => {
        await loadLive()
        await tick(T)
        await tick(after(1_000))
        const ids = liveIds()

        await loadLive()
        expect(await tick(after(2_000))).toBe(false)

        expect(liveIds()).toEqual(ids)
        expect(getLive().map(({ match }) => match.phase)).toEqual(['open', 'scheduled'])
        expect(await db.select().from(matches)).toHaveLength(2)
    })

    it('settles matches that ran out while the server was down', async () => {
        await loadLive()
        await tick(T)
        await tick(after(1_000))
        const [firstId, secondId] = liveIds()

        await loadLive()
        expect(await tick(after(HOUR_MS))).toBe(true)

        // both stale rows are settled with the timestamps they should have
        // had, not the time of the restart
        const first = await rowInDb(firstId)
        const firstRevealsAt = BETTING_WINDOW_MS + REVEAL_LEAD_MS
        expect(first.phase).toBe('settled')
        expect(first.startsAt).toEqual(after(firstRevealsAt))
        expect(first.settledAt).toEqual(after(firstRevealsAt + first.turns! * MS_PER_TURN))

        const second = await rowInDb(secondId)
        expect(second.phase).toBe('settled')
        expect(second.settledAt!.getTime()).toBeLessThan(after(HOUR_MS).getTime())

        // nothing unsettled is left behind except the fresh match
        const unsettled = await db.select().from(matches).where(ne(matches.phase, 'settled'))
        expect(unsettled).toHaveLength(1)
        expect(unsettled[0].phase).toBe('scheduled')
        expect(unsettled[0].opensAt).toEqual(after(HOUR_MS))
        expect(liveIds()).toEqual([unsettled[0].id])
    })
})
