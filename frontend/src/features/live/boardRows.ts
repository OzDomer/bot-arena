import type { MatchSnapshot } from '../../shared/api'
import type { SeatState } from '../arena/frameReport'
import { sortedOdds } from './odds'

type Odds = Extract<MatchSnapshot, { phase: 'open' }>['odds']

// idle: no ship yet (before the reveal the seating is unknown).
// afloat / sunk: follows the frame on screen. winner: the settled result.
export type RowState = 'idle' | 'afloat' | 'sunk' | 'winner'

export type BoardRow = {
    name: string
    label: string
    // the odds bar, relative to the favourite: 1 for the longest bar
    share: number
    state: RowState
    color: string | null
    hp: number | null
    maxHp: number | null
}

// One row per entrant, favourite first. The order never changes during a
// match: a board that reshuffles while ships sink can't be read.
export function boardRows(lineup: readonly string[], odds: Odds, seats: readonly SeatState[] | null, winner: string | null): BoardRow[] {
    const sorted = sortedOdds(lineup, odds)
    const top = Math.max(0, ...sorted.map(row => row.probability))

    return sorted.map(({ name, probability, label }) => {
        const seat = seats?.find(candidate => candidate.name === name)
        const share = top > 0 ? probability / top : 0

        if (!seat) return { name, label, share, state: name === winner ? 'winner' : 'idle', color: null, hp: null, maxHp: null }

        const state: RowState = name === winner ? 'winner' : seat.hp > 0 ? 'afloat' : 'sunk'
        return { name, label, share, state, color: seat.color, hp: seat.hp, maxHp: seat.maxHp }
    })
}
