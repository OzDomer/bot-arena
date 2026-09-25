import { describe, it, expect } from "vitest"
import { ship, world } from "../test/fixtures"
import { encode } from "./encode"
import { observe } from "../sim/observe"

// for magic index numbers check encode.ts for the explanation

describe('encode', () => {
    it('returns correct array length', () => {
        const w = world([
            ship({ id: 1 }),
        ])
        const obs = observe(w, w.ships[0])
        const enc = encode(obs)
        expect(enc.length).toBe(18)
    })

    it('ship at full hp as 1', () => {
        const w = world([
            ship({ id: 1, hp: 10 }),
        ])
        const obs = observe(w, w.ships[0])
        const enc = encode(obs)
        expect(enc[0]).toBe(1)
    })

    it('facing N encodes as (0, -1)', () => {
        const w = world([
            ship({ id: 1, facing: 'N' }),
        ])
        const obs = observe(w, w.ships[0])
        const enc = encode(obs)
        expect(enc[1]).toBe(0)
        expect(enc[2]).toBe(-1)
    })
    it('ship at the center', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 } }),
        ])
        const obs = observe(w, w.ships[0])
        const enc = encode(obs)
        expect(enc[3]).toBe(0)
        expect(enc[4]).toBe(0)
    })

    it('no visible ships show up as 0s', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 } }),
        ])
        const obs = observe(w, w.ships[0])
        const enc = encode(obs)
        expect(enc.slice(6)).toEqual(Array(12).fill(0))
    })
    it('one ship 3 east', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 } }),
            ship({ id: 2, position: { x: 8, y: 5 } })
        ])
        const obs = observe(w, w.ships[0])
        const enc = encode(obs)
        expect(enc.slice(6, 10)).toEqual([1, 1, 0, 1])
    })
        it('nearest ship first', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 } }),
            ship({ id: 2, position: { x: 8, y: 5 } }),
            ship({ id: 3, position: { x: 6, y: 5 }})
        ])
        const obs = observe(w, w.ships[0])
        const enc = encode(obs)
        expect(enc.slice(6, 10)).toEqual([1, 1/3, 0, 1])
    })
})
