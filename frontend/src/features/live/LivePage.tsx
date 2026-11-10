import { useCallback, useEffect, useMemo, useState } from 'react'
import Board from './Board'
import LiveHeader from './LiveHeader'
import type { LiveFrame } from './MatchReplay'
import type { Result } from './ResultBand'
import { replayMismatch, resultSummary } from './resultSummary'
import Stage from './Stage'
import Ticker from './Ticker'
import { useLeaving } from './useLeaving'
import { useLive } from './useLive'
import './live.css'

// long enough for the band's slide-out, see .result-band[data-leaving]
const RESULT_LEAVE_MS = 380

export default function LivePage() {
    const { snapshot, offset, connection, error } = useLive()
    const [clientNow, setClientNow] = useState(Date.now)
    const [reported, setReported] = useState<{ matchId: number; frame: LiveFrame } | null>(null)
    const now = useCallback(() => Date.now() + offset, [offset])

    useEffect(() => {
        const timer = setInterval(() => setClientNow(Date.now()), 200)
        return () => clearInterval(timer)
    }, [])

    const current = snapshot?.current ?? null
    const next = snapshot?.next ?? null
    const currentId = current?.matchId ?? null

    // The arena reports the frame it shows; the board and the ticker follow
    // it. A report is kept with the match it came from and dropped when the
    // next match takes over.
    const onFrame = useCallback((frame: LiveFrame) => {
        if (currentId === null) return
        setReported(last => last && last.matchId === currentId && last.frame.turn === frame.turn ? last : { matchId: currentId, frame })
    }, [currentId])
    const frame = reported && reported.matchId === currentId ? reported.frame : null

    const settled = current?.phase === 'settled' ? current : null
    const winnerColor = settled && frame ? frame.seats.find(seat => seat.name === settled.winner)?.color ?? null : null
    const mismatch = settled ? replayMismatch(settled.winner, frame?.localWinner ?? null) : null
    const result = useMemo<Result | null>(
        () => settled ? { ...resultSummary(settled.winner, settled.odds), matchId: settled.matchId, color: winnerColor, mismatch } : null,
        [settled, winnerColor, mismatch],
    )
    const leavingResult = useLeaving(result, RESULT_LEAVE_MS)

    const serverNow = clientNow + offset
    const playing = current?.phase === 'revealed' || current?.phase === 'settled'

    return (
        <div className="live">
            <LiveHeader connection={connection} />
            <Ticker current={current} next={next} frame={frame} serverNow={serverNow} ready={snapshot !== null} />
            <main className="live-main">
                <Stage
                    current={current}
                    next={next}
                    ready={snapshot !== null}
                    connection={connection}
                    error={error}
                    serverNow={serverNow}
                    msPerTurn={snapshot?.msPerTurn ?? 0}
                    now={now}
                    onFrame={onFrame}
                    result={result}
                    leavingResult={leavingResult}
                />
                <Board match={current} seats={playing && frame ? frame.seats : null} loading={snapshot === null} />
            </main>
        </div>
    )
}
