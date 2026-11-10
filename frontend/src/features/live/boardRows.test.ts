import { describe, expect, it } from 'vitest'
import type { SeatState } from '../arena/frameReport'
import { boardRows } from './boardRows'

const lineup = ['camperV2', 'evo', 'random']
const odds = { wins: { camperV2: 0.5, evo: 0.25, random: 0.05 }, draw: 0.2, timeout: 0 }

const seat = (id: number, name: string, hp: number): SeatState => ({ id, name, color: `#00000${id}`, hp, maxHp: 10 })
const seats = [seat(1, 'random', 10), seat(2, 'camperV2', 4), seat(3, 'evo', 0)]

describe('boardRows', () => {
    it('lists the favourite first with its percentage', () => {
        const rows = boardRows(lineup, odds, null, null)
        expect(rows.map(row => [row.name, row.label])).toEqual([
            ['camperV2', '50.0%'],
            ['evo', '25.0%'],
            ['random', '5.0%'],
        ])
    })

    it('scales the bars to the favourite', () => {
        expect(boardRows(lineup, odds, null, null).map(row => row.share)).toEqual([1, 0.5, 0.1])
    })

    it('has no bar to divide by when every probability is zero', () => {
        const flat = { wins: { camperV2: 0, evo: 0, random: 0 }, draw: 1, timeout: 0 }
        expect(boardRows(lineup, flat, null, null).map(row => row.share)).toEqual([0, 0, 0])
    })

    it('shows no ship, colour or hp before the seating is known', () => {
        for (const row of boardRows(lineup, odds, null, null)) {
            expect(row).toMatchObject({ state: 'idle', color: null, hp: null, maxHp: null })
        }
    })

    it('finds each ship by entrant name, whatever seat it drew', () => {
        const rows = boardRows(lineup, odds, seats, null)
        expect(rows.map(row => [row.name, row.color, row.hp])).toEqual([
            ['camperV2', '#000002', 4],
            ['evo', '#000003', 0],
            ['random', '#000001', 10],
        ])
    })

    it('marks a ship afloat while it has hp and sunk at zero', () => {
        expect(boardRows(lineup, odds, seats, null).map(row => row.state)).toEqual(['afloat', 'sunk', 'afloat'])
    })

    it('keeps the order of the odds while ships sink', () => {
        const before = boardRows(lineup, odds, null, null).map(row => row.name)
        const during = boardRows(lineup, odds, seats, null).map(row => row.name)
        expect(during).toEqual(before)
    })

    it('marks the winner once the match is settled, and only the winner', () => {
        const final = [seat(1, 'random', 0), seat(2, 'camperV2', 3), seat(3, 'evo', 0)]
        expect(boardRows(lineup, odds, final, 'camperV2').map(row => row.state)).toEqual(['winner', 'sunk', 'sunk'])
    })

    it('has no winner row on a draw or a timeout', () => {
        const final = [seat(1, 'random', 0), seat(2, 'camperV2', 0), seat(3, 'evo', 0)]
        expect(boardRows(lineup, odds, final, 'draw').map(row => row.state)).toEqual(['sunk', 'sunk', 'sunk'])
        expect(boardRows(lineup, odds, seats, 'timeout').map(row => row.state)).toEqual(['afloat', 'sunk', 'afloat'])
    })

    it('still marks the winner when the replay has not reported a frame', () => {
        expect(boardRows(lineup, odds, null, 'evo').map(row => row.state)).toEqual(['idle', 'winner', 'idle'])
    })

    it('leaves an entrant without a ship idle instead of guessing', () => {
        const partial = [seat(1, 'random', 10)]
        expect(boardRows(lineup, odds, partial, null).map(row => row.state)).toEqual(['idle', 'idle', 'afloat'])
    })
})
