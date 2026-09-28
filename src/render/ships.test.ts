import { describe, expect, it } from "vitest"
import { ship, world } from "../test/fixtures"
import { buildShipsFlat, DEAD } from "./ships"
import { signedArea } from "./paint"
import { makeCamera } from "./camera"
import { PRESETS } from "../sim/presets"

describe('buildShipsFlat', () => {
    it('one poly per ship', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, hp: 10 }),
            ship({ id: 2, position: { x: 7, y: 9 }, hp: 10 }),
            ship({ id: 3, position: { x: 6, y: 9 }, hp: 0 })
        ])
        const polys = buildShipsFlat(w)
        expect(polys.length).toBe(3)
    })
    it('dead ship fill color to gray', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, hp: 0 }),
        ])
        const polys = buildShipsFlat(w)
        expect(polys[0].fill).toBe(DEAD)
    })
    it('square sits inside its own tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 }),
        ])
        const polys = buildShipsFlat(w)
        expect(polys[0].pts.every(p => p.x > 3 && p.x < 4 && p.y > 4 && p.y < 5)).toBe(true)
    })

    it('ship faces both camera modes', () => {
        const w = world([
            ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 }),
        ])
        const isoCam = makeCamera("iso", PRESETS.bigmap)
        const topCam = makeCamera("top", PRESETS.bigmap)
        const polys = buildShipsFlat(w)
        expect(signedArea(polys[0].pts.map(p => isoCam.project(p)))).toBeGreaterThan(0)
        expect(signedArea(polys[0].pts.map(p => topCam.project(p)))).toBeGreaterThan(0)

    })
})