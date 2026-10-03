import { describe, expect, it } from "vitest"
import { deriveSeed, makeRng, shuffle } from "./random"

describe('shuffle', () => {
    it('deterministic shuffle works', () => {
        expect(shuffle([1, 2, 3, 4, 5], makeRng(1))).toEqual(shuffle([1, 2, 3, 4, 5], makeRng(1)))
    })

    it('different seed yield different result', () => {
        expect(shuffle([1, 2, 3, 4, 5], makeRng(1))).not.toEqual(shuffle([1, 2, 3, 4, 5], makeRng(2)))
    })

    it('sorted output equals sorted input', () => {
        expect([...shuffle([1, 2, 3, 4, 5], makeRng(1))].sort()).toEqual([...[1, 2, 3, 4, 5]].sort())
    })

    it('input unchanged after the call', () => {
        const input = [1, 2, 3, 4, 5]
        shuffle(input, makeRng(1))
        expect(input).toEqual([1, 2, 3, 4, 5])
    })
})

describe('deriveSeed', () => {
    it('same input same output', () => {
        expect(deriveSeed(1111, 'testing', 1)).toBe(deriveSeed(1111, 'testing', 1))
    })

    it('different purpose different output', () => {
        expect(deriveSeed(1111, 'testing', 1)).not.toBe(deriveSeed(1111, 'test', 1))
    })
    it('different index different output', () => {
        expect(deriveSeed(1111, 'testing', 1)).not.toBe(deriveSeed(1111, 'testing', 2))
    })
})

