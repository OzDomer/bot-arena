import { describe, expect, it } from 'vitest'
import { replayMismatch, resultSummary } from './resultSummary'

const odds = { wins: { camperV2: 0.29, evo: 0.131 }, draw: 0.103, timeout: 0 }

describe('resultSummary', () => {
    it('names the winner with the odds it had on the board', () => {
        expect(resultSummary('camperV2', odds)).toEqual({
            kind: 'win',
            label: 'winner',
            headline: 'camperV2',
            detail: 'had 29.0% to win',
        })
    })

    it('reads a draw as refunded, not as a winner called draw', () => {
        const summary = resultSummary('draw', odds)
        expect(summary.kind).toBe('draw')
        expect(summary.headline).toBe('Draw')
        expect(summary.detail).toContain('bets refunded')
    })

    it('reads a timeout as refunded', () => {
        const summary = resultSummary('timeout', odds)
        expect(summary.kind).toBe('timeout')
        expect(summary.headline).toBe('Timeout')
        expect(summary.detail).toContain('bets refunded')
    })

    it('does not invent odds for a winner that is not on the board', () => {
        expect(resultSummary('stranger', odds)).toMatchObject({ kind: 'win', headline: 'stranger', detail: 'not on the board' })
    })

    it('shows a winner that had no chance as 0.0%, not as missing', () => {
        expect(resultSummary('evo', { ...odds, wins: { evo: 0 } }).detail).toBe('had 0.0% to win')
    })
})

describe('replayMismatch', () => {
    it('is silent when the replay agrees with the server', () => {
        expect(replayMismatch('evo', 'evo')).toBeNull()
        expect(replayMismatch('draw', 'draw')).toBeNull()
    })

    it('is silent while there is no replay to compare', () => {
        expect(replayMismatch('evo', null)).toBeNull()
    })

    it('says both results when they differ', () => {
        expect(replayMismatch('evo', 'camperV2')).toBe('This replay ended with camperV2, the server recorded evo.')
    })
})
