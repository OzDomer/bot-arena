import { ne, eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { matches } from '../db/schema.ts'
import { nextPhase, type MatchRow, endsAt } from './nextPhase.ts'
import { createScheduledMatch } from './createScheduledMatch.ts'

const live: MatchRow[] = []

export function getLive(): readonly MatchRow[] {
    return live
}

export async function loadLive() {
    const rows = await db.select().from(matches).where(ne(matches.phase, 'settled'))
    live.splice(0, live.length, ...rows)
}

let running = false

export async function tick(now: Date) {
    if (running) return
    running = true
    try {
        for (const match of live) {
            const update = nextPhase(match, now)
            if (update.phase === match.phase) continue
            const [updated] = await db.update(matches).set(update).where(eq(matches.id, match.id)).returning()
            Object.assign(match, updated)
        }

        for (let i = live.length - 1; i >= 0; i--) {
            if (live[i].phase === 'settled') live.splice(i, 1)
        }

        if (!live.some((m) => m.phase === 'scheduled')) {
            const lastEnd = Math.max(now.getTime(), ...live.map(endsAt))
            live.push(await createScheduledMatch(new Date(lastEnd)))
        }
    } finally {
        running = false
    }
}