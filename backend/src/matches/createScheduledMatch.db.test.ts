import { describe, expect, it } from "vitest"
import { BETTING_WINDOW_MS, createScheduledMatch } from "./createScheduledMatch.ts"
import { db } from "../db/client.ts"
import { lineups, matches } from "../db/schema.ts"
import { createHash } from "node:crypto"

describe('createScheduledMatch', () => {
    it('inserts one scheduled match with a valid commitment', async() => {
        const testDate = new Date('2026-01-01T12:00:00Z')
        const firstMatch = await createScheduledMatch(testDate, 10)
        const matchesRows = await db.select().from(matches)
        const lineupRows = await db.select().from(lineups)
        const expectedHash = createHash('sha256').update(firstMatch.secret).digest('hex')
        
        expect(matchesRows).toHaveLength(1)
        expect(firstMatch).toEqual(matchesRows[0])
        expect(matchesRows[0].phase).toBe('scheduled')
        expect(matchesRows[0].lineupId).toEqual(lineupRows[0].id)
        expect(firstMatch.secret).toHaveLength(32)
        expect(firstMatch.commitHash).toBe(expectedHash)
        expect(matchesRows[0].opensAt).toEqual(testDate)
        expect(matchesRows[0].closesAt).toEqual(new Date(testDate.getTime() + BETTING_WINDOW_MS))
    })
})