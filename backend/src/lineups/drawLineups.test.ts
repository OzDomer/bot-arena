import { describe, expect, it } from "vitest"
import { drawLineup } from "./drawlineup.ts"
import { ENTRANT_NAMES, isEntrantName } from "@arena/sim/bots"

describe('drawLineup', () => {
    it('draws correct number of seats', () => {
        const lineup = drawLineup(7)
        expect(lineup.length).toBe(7)
    })
    it('draws only registered entrant names', () => {
        const lineup = drawLineup(8)
        expect(lineup.filter((name) => !isEntrantName(name))).toEqual([])
    })
    it('they are distict and sorted', () => {
        const lineup = drawLineup(8)
        const testLineup = new Set(lineup)
        expect(lineup.length).toBe(testLineup.size)
        expect(lineup).toEqual(lineup.toSorted())
    })
    it('draws an exact lineup from a fixed random source', () => {
        expect(drawLineup(2, () => 0, ['a', 'b', 'c', 'd'])).toEqual(['b', 'c'])
    })
    it('throws when passed more seats than entrants available', () => {
        expect(() => drawLineup(ENTRANT_NAMES.length + 1)).toThrow()
    })
})