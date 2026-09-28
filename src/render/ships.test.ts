import { describe, expect, it } from "vitest"
import { ship, world } from "../test/fixtures"
import { buildShips, SHIP_H, WRECK_H } from "./ships"
import { CULL_EPS, signedArea, type Poly } from "./paint"
import { makeCamera, type Camera } from "./camera"
import { PRESETS } from "../sim/presets"

const visibleCount = (polys: Poly[], cam: Camera) =>
    polys.filter(face => signedArea(face.pts.map(p => cam.project(p))) > CULL_EPS).length

describe('buildShips', () => {
    it('five faces per ship', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, hp: 10 }),
            ship({ id: 2, position: { x: 7, y: 9 }, hp: 10 }),
            ship({ id: 3, position: { x: 6, y: 9 }, hp: 0 })
        ])
        const polys = buildShips(w)
        expect(polys.length).toBe(15)
    })

    it('Culling shows the right faces', () => {
        const w = world([
            ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 }),])
        const polys = buildShips(w)
        const isoCam = makeCamera("iso", PRESETS.bigmap)
        const topCam = makeCamera("top", PRESETS.bigmap)
        expect(visibleCount(polys, isoCam)).toBe(3)
        expect(visibleCount(polys, topCam)).toBe(1)

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

    it('all five faces share the tile-center anchor', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 } })])
        for (const face of buildShips(w)) expect(face.anchor).toEqual({ x: 3.5, y: 4.5, z: 0 })
    })
})