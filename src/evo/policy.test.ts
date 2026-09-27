import { describe, expect, it } from "vitest"
import { gradLogPi, sample, softmax, updateWeights, type Sample } from "./policy"
import { makeRng } from "../util/random"
import { INPUTS, OUTPUTS, randomWeights } from "./net"

describe('softmax', () => {
    it('uniform logits give equal probabilities ', () => {
        expect(softmax([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3])

    })
    it('softmax ', () => {
        expect(softmax([1000, 1000])).toEqual([0.5, 0.5])

    })
})


describe('sample', () => {
    it('low draw picks the first segment', () => {
        expect(sample([0.5, 0.5], () => 0.1)).toBe(0)

    })
    it('high draw picks the second segment', () => {
        expect(sample([0.5, 0.5], () => 0.9)).toBe(1)

    })
    it('zero-width segments are never picked', () => {
        expect(sample([0, 1, 0], () => 0.5)).toBe(1)

    })
})
describe('gradLogPi', () => {
    it('taken row gets the +1, others only the −prob', () => {
        const x = Array(INPUTS).fill(0.5)
        const probs = softmax(Array(OUTPUTS).fill(0))
        const grad = gradLogPi(x, 3, probs)

        expect(grad[3][0]).toBeCloseTo((1 - 1 / OUTPUTS) * 0.5)
        expect(grad[0][0]).toBeCloseTo(-(1 / OUTPUTS) * 0.5)
        expect(grad[3][INPUTS]).toBeCloseTo(1 - 1 / OUTPUTS)
    })

    it('every column sums to zero across rows', () => {
        const x = Array(INPUTS).fill(0.5)
        const grad = gradLogPi(x, 3, softmax(Array(OUTPUTS).fill(0)))
        for (let i = 0; i < INPUTS + 1; i++) {
            const colSum = grad.reduce((s, row) => s + row[i], 0)
            expect(colSum).toBeCloseTo(0)
        }
    })
})

describe('updateWeights', () => {
    it('does not move when every sample has the same return', () => {
        const w = randomWeights(makeRng(1))
        const x = Array(INPUTS).fill(0.5)
        const probs = softmax(Array(OUTPUTS).fill(0))
        const samples: Sample[] = [
            { x, a: 2, probs, G: 7 },
            { x, a: 5, probs, G: 7 },
        ]
        expect(updateWeights(w, samples, 0.1)).toEqual(w)
    })
})


