import { describe, expect, it } from "vitest"
import { world, ship } from "../test/fixtures"
import { outcome } from "./outcome"

describe('outcome', () => {
    it('a lone survivor wins', () => {
        const w = world([
            ship({ id: 1, hp: 0 }),
            ship({ id: 2, hp: 10 }),
        ])
        expect(outcome(w)).toEqual({ kind: 'win', winner: 2 })
    })

    it('outcome is a draw', () => {
        const w = world([
            ship({ id: 1, hp: 0 }),
            ship({ id: 2, hp: 0 }),
        ])
        expect(outcome(w)).toEqual({ kind: 'draw' })
    })

    it('outcome is a timeout', () => {
        const w = world([
            ship({ id: 1, hp: 10 }),
            ship({ id: 2, hp: 10 }),
        ])
        expect(outcome(w)).toEqual({ kind: 'timeout' })
    })
})