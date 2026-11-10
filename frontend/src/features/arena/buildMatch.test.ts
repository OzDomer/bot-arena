import { describe, expect, it } from 'vitest'
import { outcome, playMatch, PRESETS } from '@arena/sim'
import type { Entrant } from '@arena/sim'
import { NetBrain, entrant, showcase } from '@arena/sim/bots'
import { buildMatch } from './buildMatch'

describe('buildMatch', () => {
    it('same entrants, seed and preset give a deep-equal history, names and result (determinism)', () => {
        const lineup = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const m1 = buildMatch(lineup.map(entrant), 42, 'bigmap')
        const m2 = buildMatch(lineup.map(entrant), 42, 'bigmap')
        expect(JSON.stringify(m1.history)).toBe(JSON.stringify(m2.history))
        expect(m1.names).toEqual(m2.names)
        expect(m1.result).toEqual(m2.result)
    })

    it('a different seed gives a different names seating or a different history length', () => {
        const lineup = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const base = buildMatch(lineup.map(entrant), 1, 'bigmap')
        let different = false
        for (let s = 2; s <= 6; s++) {
            const other = buildMatch(lineup.map(entrant), s, 'bigmap')
            const namesDifferent = Object.values(base.names).join(',') !== Object.values(other.names).join(',')
            const lenDifferent = base.history.length !== other.history.length
            if (namesDifferent || lenDifferent) different = true
        }
        expect(different).toBe(true)
    })

    it('history[0].world.turn is 0 and history[0].hits is empty', () => {
        const lineup = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const match = buildMatch(lineup.map(entrant), 1, 'bigmap')
        expect(match.history[0].world.turn).toBe(0)
        expect(match.history[0].hits).toEqual([])
    })

    it('turns are consecutive: history[i].world.turn === i for every frame', () => {
        const lineup = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const match = buildMatch(lineup.map(entrant), 1, 'bigmap')
        for (let i = 0; i < match.history.length; i++) {
            expect(match.history[i].world.turn).toBe(i)
        }
    })

    it('names has one entry per ship, keys are 1..n, and the values are exactly the lineup names', () => {
        const lineupNames = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const lineup: Entrant[] = lineupNames.map(entrant)
        const match = buildMatch(lineup, 1, 'bigmap')
        expect(Object.keys(match.names).length).toBe(lineupNames.length)
        const keys = Object.keys(match.names).map(Number).sort((a, b) => a - b)
        expect(keys).toEqual([1, 2, 3, 4])
        expect(lineupNames.every(n => Object.values(match.names).includes(n))).toBe(true)
        expect(new Set(Object.values(match.names)).size).toBe(lineupNames.length)
    })

    it('intent has an entry only for ids whose name is a learned brain and none for hand-written bots', () => {
        const lineup = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const match = buildMatch(lineup.map(entrant), 1, 'bigmap')
        for (const id of Object.keys(match.names).map(Number)) {
            expect(id in match.intent).toBe(match.names[id] === 'evo')
        }
        expect(Object.keys(match.intent)).toHaveLength(1)
    })

    it('result deep-equals outcome(history.at(-1).world)', () => {
        const lineup = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const match = buildMatch(lineup.map(entrant), 1, 'bigmap')
        expect(match.result).toEqual(outcome(match.history.at(-1)!.world))
    })

    it('rules.width is 20 for bigmap and 10 for default', () => {
        const lineup = ['camperV2'] as const
        const bigmap = buildMatch(lineup.map(entrant), 1, 'bigmap')
        const def = buildMatch(lineup.map(entrant), 1, 'default')
        expect(bigmap.rules.width).toBe(20)
        expect(def.rules.width).toBe(10)
    })

    it('the same entrants in reversed order with the same seed give a different names mapping', () => {
        const lineup = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const forward = buildMatch(lineup.map(entrant), 42, 'bigmap')
        const reversed = buildMatch([...lineup].reverse().map(entrant), 42, 'bigmap')
        const fwdNames = Object.values(forward.names).join(',')
        const revNames = Object.values(reversed.names).join(',')
        expect(fwdNames).not.toBe(revNames)
    })

    it('names follow the seating that playMatch draws from the seed', () => {
        const entrantNames = ['camperV2', 'chaserV2', 'evo', 'random'] as const
        const entrants = entrantNames.map(entrant)
        let seed = 42
        let seating: number[]
        for (; ; seed++) {
            const result = playMatch(entrants, seed, PRESETS.bigmap)
            seating = result.seating
            if (seating.join(',') !== [0, 1, 2, 3].join(',')) break
        }
        const match = buildMatch(entrants, seed, 'bigmap')
        for (let k = 0; k < seating.length; k++) {
            expect(match.names[k + 1]).toBe(entrantNames[seating[k]])
        }
    })

    it('for the showcase lineup, intent holds exactly the ships whose brain is a NetBrain', () => {
        const match = buildMatch(showcase, 1, 'bigmap')
        const { brains } = playMatch(showcase, 1, PRESETS.bigmap)
        const expectedIds = Object.entries(brains)
            .filter(([, brain]) => brain instanceof NetBrain)
            .map(([id]) => Number(id))
            .toSorted()
        expect(Object.keys(match.intent).map(Number).toSorted()).toEqual(expectedIds)
        expect(expectedIds.length).toBeGreaterThan(0)
        expect(Object.keys(match.names).length).toBeGreaterThan(expectedIds.length)
    })
})
