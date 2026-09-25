import { describe, it, expect } from "vitest"
import { argMax, forward } from "./net"


describe('forward', () => {
    it('zero weights give zero outputs', () => {
        const zeros = Array.from({ length: 9 }, () => Array(19).fill(0))
        expect(forward(zeros, Array(18).fill(0))).toEqual(Array(9).fill(0))
    })

    it('bias alone sets its output', () => {
        const w = Array.from({ length: 9 }, () => Array(19).fill(0))
        w[4][18] = 1                                  // row 4, last slot = bias
        const out = forward(w, Array(18).fill(0))
        expect(out).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0])
    })

    it('weight times input reaches its output', () => {
        const w = Array.from({ length: 9 }, () => Array(19).fill(0))
        w[0][0] = 1                                  // row 0, 0 slot 
        const inputs = Array(18).fill(0)
        inputs[0] = 0.5
        const out = forward(w, inputs)
        expect(out[0]).toBe(0.5)
    })
})

describe('argmax', () => {
    it('returns the index of the largest value', () => {
        expect(argMax([0, 0, 0, 0, 1, 0, 0, 0, 0])).toBe(4)
    })

    it('first element can win', () => {
        expect(argMax([3, 1, 2])).toBe(0)
    })
})