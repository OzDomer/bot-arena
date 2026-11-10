import { describe, expect, it } from 'vitest'
import { entrant } from '@arena/sim/bots'
import { seatColor } from '../../render/ships'
import { buildMatch } from './buildMatch'
import { frameReport } from './frameReport'

const lineup = (['camperV2', 'chaserV2', 'evo', 'random'] as const).map(entrant)
const match = buildMatch(lineup, 42, 'bigmap')
const lastTurn = match.history.length - 1

function firstMatchEnding(kind: 'win' | 'draw') {
    for (let seed = 1; seed <= 200; seed++) {
        const candidate = buildMatch(lineup, seed, 'bigmap')
        if (candidate.result.kind === kind) return candidate
    }
    throw new Error(`no seed up to 200 ends in a ${kind}`)
}

describe('frameReport', () => {
    it('reports every seat at full hp on the first frame', () => {
        const report = frameReport(match, 0)

        expect(report.turn).toBe(0)
        expect(report.lastTurn).toBe(lastTurn)
        expect(report.seats).toHaveLength(4)
        for (const seat of report.seats) {
            expect(seat.hp).toBe(seat.maxHp)
            expect(seat.maxHp).toBe(match.rules.ship.hp)
        }
    })

    it('names each seat as the match seated it', () => {
        for (const seat of frameReport(match, 0).seats) {
            expect(seat.name).toBe(match.names[seat.id])
        }
    })

    it('gives each seat the colour the renderer draws its ship in', () => {
        const report = frameReport(match, 0)
        for (const seat of report.seats) {
            expect(seat.color).toBe(seatColor(seat.id, report.seats.length))
        }
        expect(new Set(report.seats.map(seat => seat.color)).size).toBe(4)
    })

    it('follows the hp of the frame it is asked about', () => {
        for (const turn of [0, Math.floor(lastTurn / 2), lastTurn]) {
            const { ships } = match.history[turn].world
            const report = frameReport(match, turn)
            expect(report.seats.map(seat => seat.hp)).toEqual(ships.map(ship => Math.max(0, ship.hp)))
        }
    })

    it('leaves only the winner afloat on the last frame of a won match', () => {
        const won = firstMatchEnding('win')
        const afloat = frameReport(won, won.history.length - 1).seats.filter(seat => seat.hp > 0).map(seat => seat.id)
        expect(afloat).toEqual(won.result.kind === 'win' ? [won.result.winner] : null)
    })

    it('leaves nobody afloat on the last frame of a draw', () => {
        const drawn = firstMatchEnding('draw')
        const afloat = frameReport(drawn, drawn.history.length - 1).seats.filter(seat => seat.hp > 0)
        expect(afloat).toEqual([])
    })

    it('never reports a negative hp', () => {
        for (let turn = 0; turn <= lastTurn; turn++) {
            for (const seat of frameReport(match, turn).seats) expect(seat.hp).toBeGreaterThanOrEqual(0)
        }
    })

    it('clamps a turn outside the match to its ends', () => {
        expect(frameReport(match, -5).turn).toBe(0)
        expect(frameReport(match, lastTurn + 50).turn).toBe(lastTurn)
        expect(frameReport(match, lastTurn + 50).seats).toEqual(frameReport(match, lastTurn).seats)
    })
})
