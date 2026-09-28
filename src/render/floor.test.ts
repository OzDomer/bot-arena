import { describe, expect, it } from "vitest"
import { buildFloor, FLOOR } from "./floor"
import { ship, world } from "../test/fixtures"
import type { Poly } from "./paint"

const tileAt = (polys: Poly[], i: number, j: number) => 
    polys.find(p => p.pts[0].x === i && p.pts[0].y === j)

describe('buildFloor', () => {
    it('one poly per tile', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })])
        const polys = buildFloor(w)
        expect(polys.length).toBe(100)

    })

    it('no storm tiles', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })])
        const polys = buildFloor(w)
        expect(polys.every(p => p.fill === FLOOR.safe)).toBe(true)

    })

    it('turn 40, corner storm center safe', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })], 40)
        const polys = buildFloor(w)

        expect(tileAt(polys, 0, 0)?.fill).toBe(FLOOR.storm)
        expect(tileAt(polys, 5, 5)?.fill).toBe(FLOOR.safe)

    })

    it('turn 199, no safe zone', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })], 199)
        const polys = buildFloor(w)
        expect(polys.every(p => p.fill === FLOOR.storm)).toBe(true)
    })
})