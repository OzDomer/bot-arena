import { describe, expect, it } from 'vitest'
import { formatCountdown } from './countdown'

describe('formatCountdown', () => {
    it.each([
        [0, '0:00'],
        [-5000, '0:00'],
        [NaN, '0:00'],
        [1, '0:01'],
        [999, '0:01'],
        [1000, '0:01'],
        [1001, '0:02'],
        [59000, '0:59'],
        [59001, '1:00'],
        [60000, '1:00'],
        [61000, '1:01'],
        [300000, '5:00'],
        [599000, '9:59'],
        [600000, '10:00'],
        [3600000, '60:00'],
    ])('formatCountdown(%d) returns %s', (ms, expected) => {
        expect(formatCountdown(ms)).toBe(expected)
    })
})
