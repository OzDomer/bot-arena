import { asc, eq, ne } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { lineups, matches } from '../db/schema.ts'
import { holdEndsAt, nextPhase } from './nextPhase.ts'
import { createScheduledMatch } from './createScheduledMatch.ts'
import type { LiveEntry } from './snapshot.ts'

const live: LiveEntry[] = []

export function getLive(): readonly LiveEntry[] {
    return live
}

// Rows left unsettled by a previous process come back here with their
// lineups. Nothing is fixed up at load: the next tick runs them through
// nextPhase, which works from the stored timestamps, so a match that was
// due while the server was down lands in the phase it should be in by now.
export async function loadLive() {
    const rows = await db
        .select({ match: matches, lineup: lineups })
        .from(matches)
        .innerJoin(lineups, eq(matches.lineupId, lineups.id))
        .where(ne(matches.phase, 'settled'))
        .orderBy(asc(matches.opensAt), asc(matches.id))
    live.splice(0, live.length, ...rows)
}

// Boot: load what the last process left and bring it up to date before
// anything is served, so the first snapshot is never a stale phase.
export async function startLive(now: Date) {
    await loadLive()
    await tick(now)
}

let running = false

// Returns true when what the public can see has changed.
export async function tick(now: Date): Promise<boolean> {
    if (running) return false
    running = true
    let changed = false
    try {
        for (const { match } of live) {
            const update = nextPhase(match, now)
            if (update.phase === match.phase) continue
            const [updated] = await db.update(matches).set(update).where(eq(matches.id, match.id)).returning()
            Object.assign(match, updated)
            changed = true
        }

        for (let i = live.length - 1; i >= 0; i--) {
            const { match } = live[i]
            if (match.phase === 'settled' && now.getTime() >= holdEndsAt(match)) {
                live.splice(i, 1)
                changed = true
            }
        }

        if (!live.some(({ match }) => match.phase === 'scheduled')) {
            const opensAt = Math.max(now.getTime(), ...live.map(({ match }) => holdEndsAt(match)))
            live.push(await createScheduledMatch(new Date(opensAt)))
            changed = true
        }
    } finally {
        running = false
    }
    return changed
}
