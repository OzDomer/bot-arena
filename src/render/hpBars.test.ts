import { describe, expect, it } from "vitest"
import { ship, world } from "../test/fixtures"
import { buildHpBars } from "./hpBars"
import { seatColor, SHIP_H } from "./ships"

describe('buildHpBars', () => {
    it('wreck gets no bar', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 }, hp: 0 })])
        const bars = buildHpBars(w)
        expect(bars.length).toBe(0)
    })

    it('bar position is at roof center', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 })])
        const bars = buildHpBars(w)
        expect(bars[0].at).toEqual({ x: 3.5, y: 4.5, z: SHIP_H })
    })

    it('hp and max hp pass through bar', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 }, hp: 4 })])
        const bars = buildHpBars(w)
        expect(bars[0].maxHp).toBe(10)
        expect(bars[0].hp).toBe(4)
    })

    it('bar matches ship color', () => {
        const w = world([ship({ id: 1, position: { x: 3, y: 4 }, hp: 10 })])
        const bars = buildHpBars(w)
        const shipColor = seatColor(1, 1)
        expect(bars[0].color).toEqual(shipColor)
    })
})