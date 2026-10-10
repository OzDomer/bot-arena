import { describe, it, expect } from "vitest"
import { db } from "../db/client.ts"
import { lineups } from "../db/schema.ts"
import { getOrComputeOdds } from "./getOrComputeOdds.ts"
import { SIM_VERSION } from "@arena/sim"

const testNames = ['random', 'chaserV2', 'evo', 'camperV2']

describe('getOrComputeOdds', () => {
    it('computes and stores a lineup on first call', async () => {
        const row = await getOrComputeOdds(testNames, "bigmap", 10)
        const rows = await db.select().from(lineups)
        expect(rows).toHaveLength(1)
        expect(row).toEqual(rows[0])
        expect(row.names).toEqual(testNames.toSorted())
        expect(row.sampleSize).toBe(10)
        expect(row.preset).toBe("bigmap")
        expect(row.simVersion).toBe(SIM_VERSION)
        expect(Object.keys(row.odds.wins).toSorted()).toEqual(testNames.toSorted())
    })

    it('returns the stored odds on a second call without inserting', async () => {
        const first = await getOrComputeOdds(testNames, "bigmap", 10)
        const second = await getOrComputeOdds(testNames, "bigmap", 10)

        const rows = await db.select().from(lineups)
        expect(rows).toHaveLength(1)
        expect(second).toEqual(first)
    })

    it('a different name order hits the same row', async () => {
        const first = await getOrComputeOdds(testNames, "bigmap", 10)
        const second = await getOrComputeOdds(testNames.toReversed(), "bigmap", 10)

        const rows = await db.select().from(lineups)
        expect(rows).toHaveLength(1)
        expect(second).toEqual(first)
    })

    it('a different preset gets its own row', async () => {
        const first = await getOrComputeOdds(testNames, "bigmap", 10)
        const second = await getOrComputeOdds(testNames, "default", 10)

        const rows = await db.select().from(lineups)
        expect(rows).toHaveLength(2)
        expect(first.id).not.toBe(second.id)
    })

})

