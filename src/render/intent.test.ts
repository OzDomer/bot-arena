import { describe, expect, it } from "vitest"
import { ship, testCamera, world } from "../test/fixtures"
import { buildIntent } from "./intent"
import { type Camera } from "./camera"
import { type Poly, signedArea, CULL_EPS } from "./paint"

const visibleCount = (polys: Poly[], cam: Camera) =>
    polys.filter(face => signedArea(face.pts.map(p => cam.project(p))) > CULL_EPS).length


describe('buildIntent', () => {
    it('all nine intent polys are front-facing in both modes', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 } })])
        const zeros = Array.from({ length: 9 }, () => Array(19).fill(0))   // uniform probs
        const polys = buildIntent(w, { 1: zeros })
        expect(polys.length).toBe(9)
        expect(visibleCount(polys, testCamera('iso'))).toBe(9)
        expect(visibleCount(polys, testCamera('top'))).toBe(9)
    })
}
)