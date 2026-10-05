import { describe, expect, it } from "vitest"
import type { Entrant } from "../types.ts"
import { ChaserV1 } from "../bots/ChaserV1.ts"
import { runTournament } from "./tournament.ts"

describe('runTournament', () => {
    it('damage dealt equals damage taken', () => {
        const entrants: Entrant[] = [
            { name: 'chaser', make: rng => new ChaserV1(rng) },
            { name: 'chaser', make: rng => new ChaserV1(rng) },
            { name: 'chaser', make: rng => new ChaserV1(rng) },
        ]
        const { totals } = runTournament(entrants, 10, 1)
        const dealt = totals.reduce((sum, s) => sum + s.damageDealt, 0)   // sum of damageDealt across totals
        const taken = totals.reduce((sum, s) => sum + s.damageTaken, 0)
        expect(dealt).toBe(taken)
        expect(dealt).toBeGreaterThan(0)   // guards against a tournament where nobody fought
    })
})