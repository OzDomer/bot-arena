import { describe, expect, it } from "vitest"
import { SHIP_H } from "./ships"
import { ship, world } from "@arena/sim/testing"
import { buildHits } from "./combat"

describe('buildHits', () => {
    it('one hit becomes a mark between the two roof centers', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 } }),
        ship({ id: 2, position: { x: 4, y: 4 } })])
        const marks = buildHits(w, [{ attacker: 1, target: 2, amount: 2 }])
        expect(marks).toEqual([{ from: { x: 3.5, y: 4.5, z: SHIP_H }, to: { x: 4.5, y: 4.5, z: SHIP_H }, amount: 2 }])
    })
    it('no hits, no marks', () => {
        expect(buildHits(world([]), [])).toEqual([])
    })
})