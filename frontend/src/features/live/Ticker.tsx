import type { CSSProperties } from 'react'
import type { MatchSnapshot } from '../../shared/api'
import { formatCountdown } from '../../shared/countdown'
import type { LiveFrame } from './MatchReplay'
import { isUrgent, startCue, turnProgress } from './stageClock'

const PHASE: Record<MatchSnapshot['phase'], string> = {
    scheduled: 'scheduled',
    open: 'bets open',
    closed: 'bets closed',
    revealed: 'playing',
    settled: 'result',
}

type TickerProps = {
    current: MatchSnapshot | null
    next: MatchSnapshot | null
    frame: LiveFrame | null
    serverNow: number
    // false until the first snapshot arrives
    ready: boolean
}

// One line under the header: which match, which phase, and the one number
// that matters in that phase.
export default function Ticker({ current, next, frame, serverNow, ready }: TickerProps) {
    const left = (iso: string) => Date.parse(iso) - serverNow
    let detail: string | null = null
    let urgent = false
    let progress = 0

    if (current?.phase === 'open') {
        detail = `closes in ${formatCountdown(left(current.closesAt))}`
        urgent = isUrgent(left(current.closesAt))
    } else if (current?.phase === 'closed') {
        detail = 'revealing the seed'
    } else if (current?.phase === 'revealed') {
        const untilStart = left(current.startsAt)
        detail = startCue(untilStart) ? `starts in ${formatCountdown(untilStart)}` : frame ? `turn ${frame.turn} / ${frame.lastTurn}` : null
        progress = frame ? turnProgress(frame.turn, frame.lastTurn) : 0
    } else if (current?.phase === 'settled') {
        detail = current.winner
        progress = 1
    }

    return (
        <div className="ticker" data-turn={frame?.turn}>
            {current
                ? <strong className="ticker-match">match #{current.matchId}</strong>
                : <span className="ticker-phase" role="status">{ready ? 'no match yet' : 'connecting'}</span>}
            {current && <span className="ticker-phase" role="status">{PHASE[current.phase]}</span>}
            {detail && <span className="ticker-detail" data-urgent={urgent || undefined}>{detail}</span>}
            {next && <span className="ticker-next">next opens in {formatCountdown(left(next.opensAt))}</span>}
            <span className="ticker-progress" style={{ '--progress': progress } as CSSProperties} aria-hidden="true" />
        </div>
    )
}
