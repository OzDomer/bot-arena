import { describe, expect, it } from "vitest"
import { computeOdds } from "./computeOdds.ts"

const testNames = ['camperV2', 'chaserV2', 'evo', 'random']
const odds = computeOdds(testNames, "bigmap", 50)
const rates = [...Object.values(odds.wins), odds.draw, odds.timeout]


describe('computeOdds', () => {
    it('the wins keys equals the names', () => {
        expect(Object.keys(odds.wins)).toEqual(testNames)
    })

    it('every rate is between 0 and 1', () => {
        for (const rate of rates) {
            expect(rate).toBeGreaterThanOrEqual(0)
            expect(rate).toBeLessThanOrEqual(1)
        }
    })

    it('everything sums to 1', () => {
        expect(rates.reduce((a, n) => n + a, 0)).toBeCloseTo(1)
    })

    it('the same input twice gives equal odds', () => {
        const match2 = computeOdds(testNames, "bigmap", 50)
        expect(odds).toEqual(match2)
    })

    it('rejects unknown name', () => {
        expect(() => computeOdds(['notARealBot'], 'bigmap', 1)).toThrow('unknown entrant: notARealBot')
    })

})