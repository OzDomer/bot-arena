import { describe, expect, it } from 'vitest'
import { parseMatchParams } from './matchParams'

describe('parseMatchParams', () => {
    it('accepts a valid seed and preset', () => {
        expect(parseMatchParams('?seed=42&preset=bigmap')).toEqual({ seed: 42, preset: 'bigmap' })
    })

    it('accepts the largest uint32', () => {
        expect(parseMatchParams('?seed=4294967295&preset=bigmap')).toEqual({ seed: 4294967295, preset: 'bigmap' })

    })

    it('rejects a seed past uint32', () => {
        expect(parseMatchParams('?seed=4294967296&preset=bigmap')).toBeNull()
    })

    it('missing seed', () => {
        expect(parseMatchParams('?&preset=bigmap')).toBeNull()
    })

    it('empty seed', () => {
        expect(parseMatchParams('?seed=&preset=bigmap')).toBeNull()
    })


    it('letters in seed', () => {
        expect(parseMatchParams('?seed=xddxd&preset=bigmap')).toBeNull()
    })

    it('scientific notation in seed', () => {
        expect(parseMatchParams('?seed=1e3&preset=bigmap')).toBeNull()
    })

    it('negative number in seed', () => {
        expect(parseMatchParams('?seed=-69&preset=bigmap')).toBeNull()
    })

    it('decimal in seed', () => {
        expect(parseMatchParams('?seed=4.20&preset=bigmap')).toBeNull()
    })

    it('missing preset', () => {
        expect(parseMatchParams('?seed=42')).toBeNull()
    })

    it('unknown preset', () => {
        expect(parseMatchParams('?seed=42&preset=xd')).toBeNull()
    })

})