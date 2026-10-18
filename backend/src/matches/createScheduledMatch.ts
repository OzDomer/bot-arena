import { createHash, randomBytes } from "node:crypto"
import { drawLineup } from "../lineups/drawLineup.ts"
import { getOrComputeOdds } from "../lineups/getOrComputeOdds.ts"
import { db } from "../db/client.ts"
import { matches } from "../db/schema.ts"
import { outcome, playMatch, PRESETS, seedFromSecret } from "@arena/sim"
import { entrant, isEntrantName } from "@arena/sim/bots"


export const BETTING_WINDOW_MS = 5 * 60 * 1000

export async function createScheduledMatch(opensAt: Date = new Date(), oddsSampleSize = 2000) {
    const lineup = drawLineup(8)
    const lineupRow = await getOrComputeOdds(lineup, "bigmap", oddsSampleSize)
    const secret = randomBytes(32)
    const commitHash = createHash('sha256').update(secret).digest('hex')
    const entrants = lineup.map((name) => {
        if (!isEntrantName(name)) throw new Error(`unknown entrant: ${name}`)
        return entrant(name)
    })
    const { final, seating } = playMatch(entrants, seedFromSecret(secret), PRESETS.bigmap)
    const result = outcome(final)
    const winner = result.kind === "win" ? entrants[seating[result.winner - 1]].name : result.kind


    const [row] = await db.insert(matches).values({
        lineupId: lineupRow.id,
        phase: 'scheduled',
        secret,
        commitHash,
        opensAt,
        closesAt: new Date(opensAt.getTime() + BETTING_WINDOW_MS),
        turns: final.turn,
        winner
    }).returning()
    return row
}