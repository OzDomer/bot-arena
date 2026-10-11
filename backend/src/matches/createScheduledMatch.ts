import { createHash, randomBytes } from "node:crypto"
import { drawLineup } from "../lineups/drawLineup.ts"
import { getOrComputeOdds } from "../lineups/getOrComputeOdds.ts"
import { db } from "../db/client.ts"
import { matches } from "../db/schema.ts"

export const BETTING_WINDOW_MS = 5 * 60 * 1000

export async function createScheduledMatch(now: Date = new Date(),oddsSampleSize: number = 2000) {
    const lineup = drawLineup(8)
    const lineupRow = await getOrComputeOdds(lineup, "bigmap", oddsSampleSize)
    const secret = randomBytes(32)
    const commitHash = createHash('sha256').update(secret).digest('hex')

    
    const [row] = await db.insert(matches).values({
        lineupId: lineupRow.id,
        phase: 'scheduled',
        secret,
        commitHash,
        opensAt: now,
        closesAt: new Date(now.getTime() + BETTING_WINDOW_MS),
    }).returning()
    return row
}