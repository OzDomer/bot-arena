import { describe, expect, it } from "vitest"
import { sample, softmax } from "./policy"

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




