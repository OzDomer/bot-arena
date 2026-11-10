import { describe, expect, it } from 'vitest'
import { formatProbability, sortedOdds } from './odds'

describe('odds presentation', () => {
    it.each([[0, '0.0%'], [1, '100.0%'], [0.125, '12.5%'], [0.333333, '33.3%']])('formats %s as %s', (probability, label) => {
        expect(formatProbability(probability)).toBe(label)
    })

    it('sorts the lineup by descending win probability without changing seating order', () => {
        const lineup = ['random', 'chaserV2', 'cowardV1']
        const odds = { wins: { random: 0.1, chaserV2: 0.6, cowardV1: 0.2, other: 1 }, draw: 0.05, timeout: 0.05 }
        expect(sortedOdds(lineup, odds)).toEqual([
            { name: 'chaserV2', probability: 0.6, label: '60.0%' },
            { name: 'cowardV1', probability: 0.2, label: '20.0%' },
            { name: 'random', probability: 0.1, label: '10.0%' },
        ])
        expect(lineup).toEqual(['random', 'chaserV2', 'cowardV1'])
    })

    it('breaks equal-probability ties by entrant name', () => {
        expect(sortedOdds(['random', 'chaserV2'], { wins: { random: 0.5, chaserV2: 0.5 }, draw: 0, timeout: 0 })
            .map(row => row.name)).toEqual(['chaserV2', 'random'])
    })
})
