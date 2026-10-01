import { describe, expect, it } from "vitest"
import { ship, testCamera, world } from "../test/fixtures"
import { buildShips, SHIP_H, WRECK_H } from "./ships"
import { CULL_EPS, signedArea, type Poly } from "./paint"
import { fitView, naturalSize, ZOOM_MAX, ZOOM_MIN, type Camera } from "./camera"
import { PRESETS } from "../sim/presets"

const visibleCount = (polys: Poly[], cam: Camera) =>
    polys.filter(face => signedArea(face.pts.map(p => cam.project(p))) > CULL_EPS).length

describe('buildShips', () => {
    it('six faces per alive ship', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, hp: 10 }),
        ])
        const polys = buildShips(w)
        expect(polys.length).toBe(6)
    })

    it('five faces per dead ship', () => {
        const w = world([
            ship({ id: 3, position: { x: 6, y: 9 }, hp: 0 })
        ])
        const polys = buildShips(w)
        expect(polys.length).toBe(5)
    })

    it('Culling shows the right faces', () => {
        const w = world([
            ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 }),])
        const polys = buildShips(w)
        const isoCam = testCamera('iso')
        const topCam = testCamera('top')
        expect(visibleCount(polys, isoCam)).toBe(4)
        expect(visibleCount(polys, topCam)).toBe(2)

    })

    it('wreck top sits at WRECK_H', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, hp: 0 }),
        ])
        const polys = buildShips(w)
        expect(polys[0].pts.every(p => p.z === WRECK_H)).toBe(true)
    })

    it('live ship top sits at SHIP_H', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, hp: 10 }),
        ])
        const polys = buildShips(w)
        expect(polys[0].pts.every(p => p.z === SHIP_H)).toBe(true)
    })

    it('ship sits inside its own tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 }),
        ])
        const polys = buildShips(w)
        expect(polys.flatMap(p => p.pts).every(p => p.x > 3 && p.x < 4 && p.y > 4 && p.y < 5 && p.z >= 0 && p.z <= SHIP_H)).toBe(true)
    })

    it('every face shares the tile-center anchor', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 } })])
        for (const face of buildShips(w)) expect(face.anchor).toEqual({ x: 3.5, y: 4.5, z: 0 })
    })

    it('nose tip points along the facing', () => {
        const w = world([
            ship({ id: 1, position: { x: 3, y: 4 }, facing: 'E' }),
        ])
        const polys = buildShips(w)
        const tip = polys[polys.length - 1].pts[0]
        expect(tip.x).toBeCloseTo(3.8)
        expect(tip.y).toBeCloseTo(4.5)
        expect(tip.z).toBeCloseTo(SHIP_H)

    })

    it('no two ships share a color', () => {
        const w = world(
            Array.from({ length: 9 }, (_, i) => ship({ id: i + 1, position: { x: i, y: 5 } }))
        )
        const polys = buildShips(w)
        const fills = w.ships.map((_, i) => polys[i * 6].fill)
        expect(new Set(fills).size).toBe(9)
    })

    it.each([ZOOM_MIN, ZOOM_MAX])('culling holds at zoom %s', zoom => {
        const w = world([
            ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 }),])
        const polys = buildShips(w)
        const view = { zoom, pan: { x: 0, y: 0 } }
        const isoCam = testCamera('iso', view)
        const topCam = testCamera('top', view)
        expect(visibleCount(polys, isoCam)).toBe(4)
        expect(visibleCount(polys, topCam)).toBe(2)
        // same single ship as 'Culling shows the right faces'
        // view = { zoom, pan: { x: 0, y: 0 } }
        // isoCam = testCamera('iso', view), topCam = testCamera('top', view)
        // visibleCount: 4 iso, 2 top
    })

})