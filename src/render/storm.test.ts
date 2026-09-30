import { describe, expect, it } from "vitest"
import { world } from "../test/fixtures"
import { buildRing } from "./ring"

describe('buildRing', () => {
    it('64 points, starting due east of the center', () => {
        const w = world([], 40)
        const polys = buildRing(w)
        expect(polys[0].pts.length).toBe(64)
        const p0 = polys[0].pts[0]
        expect(p0.x).toBeCloseTo(12.5)
        expect(p0.y).toBeCloseTo(5.5)
        expect(p0.z).toBe(0)
    })

    it('every point is exactly the radius from the center', () => {
        const w = world([], 40)
        const [ring] = buildRing(w)
        for (const p of ring.pts) expect(Math.hypot(p.x - 5.5, p.y - 5.5)).toBeCloseTo(7)
    })

    it('no ring once the storm covers the map', () => {
        expect(buildRing(world([], 199))).toEqual([])
    })
})