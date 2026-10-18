import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { matches } from '../db/schema.ts'
import { getLive, loadLive, tick } from './live.ts'
import { BETTING_WINDOW_MS } from './createScheduledMatch.ts'
import { MS_PER_TURN, REVEAL_LEAD_MS } from './nextPhase.ts'

const T = new Date('2026-01-01T12:00:00Z')
const after = (ms: number) => new Date(T.getTime() + ms)

async function rowInDb(id: number) {
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    return row
}

describe('tick', () => {
    it('drives one match through its whole lifecycle and keeps the pipeline full', async () => {
        await loadLive()
        expect(getLive()).toHaveLength(0)

        // empty table: the first tick creates the first match
        await tick(T)
        expect(getLive()).toHaveLength(1)
        const first = getLive()[0]
        expect(first.phase).toBe('scheduled')

        // opening it leaves nothing scheduled, so a second one is created
        await tick(after(1_000))
        expect(first.phase).toBe('open')
        expect(getLive()).toHaveLength(2)
        expect(getLive()[1].phase).toBe('scheduled')
        expect((await rowInDb(first.id)).phase).toBe('open')

        await tick(after(BETTING_WINDOW_MS))
        expect(first.phase).toBe('closed')

        const revealsAt = BETTING_WINDOW_MS + REVEAL_LEAD_MS
        await tick(after(revealsAt))
        expect(first.phase).toBe('revealed')
        expect(first.startsAt).toEqual(after(revealsAt))
        expect((await rowInDb(first.id)).startsAt).toEqual(after(revealsAt))

        const endsAt = revealsAt + first.turns! * MS_PER_TURN
        await tick(after(endsAt))
        expect(getLive().some((m) => m.id === first.id)).toBe(false)
        const settled = await rowInDb(first.id)
        expect(settled.phase).toBe('settled')
        expect(settled.settledAt).toEqual(after(endsAt))
    })

    it('loads unsettled matches from the table at boot', async () => {
        await loadLive()
        await tick(T)
        await tick(after(1_000))
        const ids = getLive().map((m) => m.id)

        await loadLive()
        expect(getLive().map((m) => m.id)).toEqual(ids)
    })
})