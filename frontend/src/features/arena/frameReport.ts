import { seatColor } from '../../render/ships'
import type { Match } from './buildMatch'

export type SeatState = {
    id: number
    name: string
    color: string
    hp: number
    maxHp: number
}

// What the arena says about the frame it is showing: enough for anything
// outside the canvas to follow the match seat by seat.
export type FrameReport = {
    turn: number
    lastTurn: number
    seats: SeatState[]
}

export function frameReport(match: Match, turn: number): FrameReport {
    const lastTurn = match.history.length - 1
    const shown = Math.max(0, Math.min(lastTurn, turn))
    const { ships } = match.history[shown].world

    return {
        turn: shown,
        lastTurn,
        seats: ships.map(ship => ({
            id: ship.id,
            name: match.names[ship.id],
            // the colour the renderer gives the same ship
            color: seatColor(ship.id, ships.length),
            hp: Math.max(0, ship.hp),
            maxHp: ship.maxHp,
        })),
    }
}
