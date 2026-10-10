import { SIM_VERSION, type PresetName } from "@arena/sim"
import { canonicalNames } from "./canonicalNames.ts"
import { db } from "../db/client.ts"
import { lineups } from "../db/schema.ts"
import { eq, and } from "drizzle-orm"
import { computeOdds } from "./computeOdds.ts"

export async function getOrComputeOdds(names: readonly string[], preset: PresetName, matches = 2000) {
    const sorted = canonicalNames(names)
    const [row] = await db.select().from(lineups).where(and(
        eq(lineups.names, sorted),
        eq(lineups.preset, preset),
        eq(lineups.simVersion, SIM_VERSION),
    ))
    if (row) return row
    const odds = computeOdds(sorted, preset, matches)
    const [insertedRow] = await db.insert(lineups).values({
        names: sorted,
        preset,
        simVersion: SIM_VERSION,
        odds,
        sampleSize: matches
    }).returning()
    return insertedRow

}