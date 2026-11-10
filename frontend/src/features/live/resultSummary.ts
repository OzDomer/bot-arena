import type { MatchSnapshot } from '../../shared/api'
import { formatProbability } from './odds'

type Odds = Extract<MatchSnapshot, { phase: 'open' }>['odds']

export type ResultSummary = {
    kind: 'win' | 'draw' | 'timeout'
    label: string
    headline: string
    // for a win, the odds the winner had on the board
    detail: string
}

// The server's winner field is an entrant name, or the words draw / timeout.
export function resultSummary(winner: string, odds: Odds): ResultSummary {
    if (winner === 'draw') {
        return { kind: 'draw', label: 'no winner', headline: 'Draw', detail: 'no ship left afloat · bets refunded' }
    }
    if (winner === 'timeout') {
        return { kind: 'timeout', label: 'no winner', headline: 'Timeout', detail: 'turn limit reached · bets refunded' }
    }
    const probability = odds.wins[winner]
    const detail = typeof probability === 'number' ? `had ${formatProbability(probability)} to win` : 'not on the board'
    return { kind: 'win', label: 'winner', headline: winner, detail }
}

// The local replay is a check on the server, never the result of record.
export function replayMismatch(serverWinner: string, localWinner: string | null): string | null {
    if (localWinner === null || localWinner === serverWinner) return null
    return `This replay ended with ${localWinner}, the server recorded ${serverWinner}.`
}
