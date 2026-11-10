import { describe, expect, it } from 'vitest'
import { isUrgent, shortHash, startCue, turnProgress } from './stageClock'

describe('isUrgent', () => {
    it.each([
        [45_000, false],
        [10_001, false],
        [10_000, true],
        [1, true],
        [0, false],
        [-500, false],
        [NaN, false],
    ])('%d ms left: %s', (ms, urgent) => {
        expect(isUrgent(ms)).toBe(urgent)
    })
})

describe('startCue', () => {
    it.each([
        [4_000, 'ready'],
        [3_001, 'ready'],
        [3_000, 3],
        [2_001, 3],
        [2_000, 2],
        [1_001, 2],
        [1_000, 1],
        [1, 1],
        [0, null],
        [-200, null],
        [NaN, null],
    ] as const)('%d ms before the first frame shows %s', (ms, cue) => {
        expect(startCue(ms)).toBe(cue)
    })

    it('never counts from higher than three', () => {
        expect(startCue(60_000)).toBe('ready')
    })
})

describe('turnProgress', () => {
    it.each([
        [0, 100, 0],
        [25, 100, 0.25],
        [100, 100, 1],
        [150, 100, 1],
        [-3, 100, 0],
        [0, 0, 0],
        [5, 0, 0],
    ])('turn %d of %d is %d', (turn, lastTurn, progress) => {
        expect(turnProgress(turn, lastTurn)).toBe(progress)
    })
})

describe('shortHash', () => {
    it('keeps the first and last eight characters of a commitment', () => {
        const hash = 'f883faea26b93afb' + '0'.repeat(32) + '1122334455667788'
        expect(shortHash(hash)).toBe('f883faea…55667788')
    })

    it('leaves a short string alone', () => {
        expect(shortHash('abc123')).toBe('abc123')
    })
})
