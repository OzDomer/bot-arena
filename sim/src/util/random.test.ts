import { describe, expect, it } from "vitest"
import { deriveSeed, makeRng, seedFromSecret, shuffle } from "./random"

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

describe('seedFromSecret', () => {
    it('reads the first four bytes big-endian', () => {
        const bytes = new Uint8Array(32)
        bytes.set([0x12, 0x34, 0x56, 0x78])
        expect(seedFromSecret(bytes)).toEqual(305419896)
    })

    it('reads all-FF as max uint32', () => {
        const bytes = new Uint8Array(32)
        bytes.set([0xFF, 0xFF, 0xFF, 0xFF])
        expect(seedFromSecret(bytes)).toEqual(4294967295)
    })

    it('only first 4 bytes count', () => {
        const bytes = new Uint8Array(32)
        bytes.set([0x12, 0x34, 0x56, 0x78, 0x69])
        expect(seedFromSecret(bytes)).toEqual(305419896)
    })

    it('less than 32 bytes errors', () => {
        const bytes = new Uint8Array(31)
        expect(() => seedFromSecret(bytes)).toThrow('32 bytes')
    })
})

