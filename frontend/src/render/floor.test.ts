import { describe, expect, it } from "vitest"
import { buildFloor} from "./floor"
import { ship, world } from "@arena/sim/testing"
import type { Poly } from "./paint"
import { LIGHT } from "./theme"

const tileAt = (polys: Poly[], i: number, j: number) => 
    polys.find(p => p.pts[0].x === i && p.pts[0].y === j)

describe('buildFloor', () => {
    it('one poly per tile', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })])
        const polys = buildFloor(w, LIGHT)
        expect(polys.length).toBe(100)

    })

    it('no storm tiles', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })])
        const polys = buildFloor(w, LIGHT)
        expect(polys.every(p => p.fill === LIGHT.floorSafe)).toBe(true)

    })

    it('turn 40, corner storm center safe', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })], 40)
        const polys = buildFloor(w, LIGHT)

        expect(tileAt(polys, 0, 0)?.fill).toBe(LIGHT.floorStorm)
        expect(tileAt(polys, 5, 5)?.fill).toBe(LIGHT.floorSafe)

    })

    it('turn 199, no safe zone', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })], 199)
        const polys = buildFloor(w, LIGHT)
        expect(polys.every(p => p.fill === LIGHT.floorStorm)).toBe(true)
    })
})