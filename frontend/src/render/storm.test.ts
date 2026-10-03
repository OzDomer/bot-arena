import { describe, expect, it } from "vitest"
import { ship, world } from "@arena/sim/testing"
import { buildRing, buildStormMarks } from "./storm"
import { step } from "@arena/sim"
import { roofCenter } from "./ships"
import { resolveAttacks } from "@arena/sim"
import type { Ship, Action } from "@arena/sim"
import { LIGHT } from "./theme"

describe('buildRing', () => {
    it('64 points, starting due east of the center', () => {
        const w = world([], 40)
        const polys = buildRing(w, LIGHT)
        expect(polys[0].pts.length).toBe(64)
        const p0 = polys[0].pts[0]
        expect(p0.x).toBeCloseTo(12.5)
        expect(p0.y).toBeCloseTo(5.5)
        expect(p0.z).toBe(0)
    })

    it('every point is exactly the radius from the center', () => {
        const w = world([], 40)
        const [ring] = buildRing(w, LIGHT)
        for (const p of ring.pts) expect(Math.hypot(p.x - 5.5, p.y - 5.5)).toBeCloseTo(7)
    })

    it('no ring once the storm covers the map', () => {
        expect(buildRing(world([], 199), LIGHT)).toEqual([])
    })
})

describe('buildStormMarks', () => {
    it('corner ship at turn 40 takes 3', () => {
        const prev = world([ship({ id: 1, position: { x: 0, y: 0 } })], 40)
        const cur = step(prev, { 1: { move: 'STAY' } })
        expect(buildStormMarks(prev, cur, [])).toEqual([{ at: roofCenter({ x: 0, y: 0 }), amount: 3 }])
    })

    it('two ships outside storm produce two storm hits', () => {
        const prev = world([
            ship({ id: 1, position: { x: 0, y: 0 } }),
            ship({ id: 2, position: { x: 1, y: 0 } })
        ], 70)
        const actions: Record<Ship['id'], Action> = { 1: { move: 'STAY' }, 2: { move: 'STAY' } }
        const cur = step(prev, actions)
        const marks = buildStormMarks(prev, cur, [])
        expect(marks.length).toBe(2)
    })

    it('hit and storm split correctly', () => {
        const prev = world([ship({ id: 1, position: { x: 0, y: 0 } }),
        ship({ id: 2, position: { x: 1, y: 0 } })
        ], 40)
        const actions: Record<Ship['id'], Action> = { 1: { move: 'STAY' }, 2: { move: 'STAY', attack: 1 } }
        const cur = step(prev, actions)
        const hits = resolveAttacks(prev, actions)
        const marks = buildStormMarks(prev, cur, hits)
        expect(marks.find(m => m.at.x === 0.5)?.amount).toBe(3)
    })

    it('overkill shows what was lost, not the phase damage', () => {
        const prev = world([ship({ id: 1, position: { x: 0, y: 0 }, hp: 1 })], 40)
        const cur = step(prev, { 1: { move: 'STAY' } })
        expect(buildStormMarks(prev, cur, [])[0].amount).toBe(1)
    })
})