import { describe, expect, it } from "vitest"
import { world, ship } from "../test/fixtures"
import { buildLabels } from "./labels"
import { SHIP_H } from "./ships"

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