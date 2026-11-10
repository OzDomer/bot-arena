import { describe, expect, it } from 'vitest'
import { frameForTime, remainingMs } from './liveTime'

describe('frameForTime', () => {
    const startsAt = 10_000

    it.each([
        ['before start', 9_000, 0],
        ['exactly at start', 10_000, 0],
        ['within the first turn', 10_149, 0],
        ['at a turn boundary', 10_150, 1],
        ['mid-match', 10_779, 5],
        ['last frame', 11_500, 10],
        ['long after the end', 1_000_000, 10],
    ])('%s', (_label, now, expected) => {
        expect(frameForTime(startsAt, 150, 10, now)).toBe(expected)
    })

    it('corrects both fast and slow viewer clocks', () => {
        expect(frameForTime(startsAt, 150, 10, 5_750, 5_000)).toBe(5)
        expect(frameForTime(startsAt, 150, 10, 15_750, -5_000)).toBe(5)
    })

    it('lands late viewers on the same frame without counting ticks', () => {
        expect(frameForTime(startsAt, 150, 10, 11_201)).toBe(8)
        expect(frameForTime(startsAt, 150, 10, 61_201, -50_000)).toBe(8)
    })

    it('handles a match with only its initial frame', () => {
        expect(frameForTime(startsAt, 150, 0, 11_201)).toBe(0)
    })
})

describe('remainingMs', () => {
    it('uses the server clock offset', () => {
        expect(remainingMs(10_000, 5_000, 2_000)).toBe(3_000)
        expect(remainingMs(10_000, 15_000, -7_000)).toBe(2_000)
    })

    it('stops at zero at and after the deadline', () => {
        expect(remainingMs(10_000, 10_000)).toBe(0)
        expect(remainingMs(10_000, 20_000)).toBe(0)
    })
})
