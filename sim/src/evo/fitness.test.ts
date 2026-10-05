import { describe, it, expect } from "vitest"
import { fitness } from "./fitness.ts"
import { emptyStats } from "../sim/stats.ts"


describe('fitness', () => {
    it('correct fitness score', () => {
        const stats = { ...emptyStats(), wins: 1, damageDealt: 8, survivalTurns: 30 }
        expect(fitness(stats)).toEqual(138)

    })
})
