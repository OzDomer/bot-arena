import { describe, expect, it } from "vitest"
import { ship, world } from "@arena/sim/testing"
import { SHIP_H, seatColor } from "./ships"
import { buildHpBars, buildLabels } from "./plate"

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


describe('buildLabels', () => {
    it('wreck gets no label', () => {
        const w = world(
            [ship({ id: 1, position: { x: 5, y: 5 } }),
            ship({ id: 2, position: { x: 5, y: 6 }, hp: 0 })
            ])
        const names = { 1: 'chaser', 2: 'coward' }
        const labels = buildLabels(w, names)
        expect(labels.length).toBe(1)

    })

    it('label position is the roof center', () => {
        const w = world(
            [ship({ id: 1, position: { x: 3, y: 4 } })])
        const names = { 1: 'chaser' }
        const labels = buildLabels(w, names)
        expect(labels[0].at).toEqual({ x: 3.5, y: 4.5, z: SHIP_H })

    })

    it('label text is name and hp', () => {
        const w = world(
            [ship({ id: 1, position: { x: 3, y: 4 }, hp: 7 })])
        const names = { 1: 'chaser' }
        const labels = buildLabels(w, names)
        expect(labels[0].text).toBe('chaser')

    })


    it('missing name falls back to id', () => {
        const w = world(
            [ship({ id: 1, position: { x: 3, y: 4 }, hp: 7 })])
        const names = {}
        const labels = buildLabels(w, names)
        expect(labels[0].text).toBe('1')

    })
})