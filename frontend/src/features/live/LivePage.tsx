import { useCallback, useEffect, useState } from 'react'
import type { MatchSnapshot } from '../../shared/api'
import { formatCountdown } from '../../shared/countdown'
import { remainingMs } from '../../shared/liveTime'
import LiveHeader from './LiveHeader'
import MatchReplay from './MatchReplay'
import { formatProbability, sortedOdds } from './odds'
import { useLive } from './useLive'
import './live.css'

function Lineup({ match }: { match: Exclude<MatchSnapshot, { phase: 'scheduled' }> }) {
    return (
        <>
            <ul className="board-rows">
                {sortedOdds(match.lineup, match.odds).map(({ name, label }) => (
                    <li key={name} className="board-row"><span>{name}</span><strong>{label}</strong></li>
                ))}
            </ul>
            <p className="board-foot">Draw {formatProbability(match.odds.draw)} · Timeout {formatProbability(match.odds.timeout)}</p>
        </>
    )
}

function phaseText(match: MatchSnapshot): string {
    switch (match.phase) {
        case 'scheduled': return 'scheduled'
        case 'open': return 'bets open'
        case 'closed': return 'bets closed'
        case 'revealed': return 'playing'
        case 'settled': return 'result'
    }
}

export default function LivePage() {
    const { snapshot, offset, connection, error } = useLive()
    const [clientNow, setClientNow] = useState(Date.now)
    const now = useCallback(() => Date.now() + offset, [offset])

    useEffect(() => {
        const timer = setInterval(() => setClientNow(Date.now()), 200)
        return () => clearInterval(timer)
    }, [])

    const countdown = (date: string) => formatCountdown(remainingMs(Date.parse(date), clientNow, offset))
    const current = snapshot?.current ?? null
    const playing = current && (current.phase === 'revealed' || current.phase === 'settled') ? current : null

    return (
        <div className="live">
            <LiveHeader connection={connection} />
            <div className="ticker" aria-live="polite">
                {current
                    ? <><strong>Match #{current.matchId}</strong><span>{phaseText(current)}</span></>
                    : <span>{snapshot ? 'no match yet' : 'connecting'}</span>}
                {current?.phase === 'open' && <span>closes in {countdown(current.closesAt)}</span>}
                {snapshot?.next && <span className="ticker-next">next opens in {countdown(snapshot.next.opensAt)}</span>}
            </div>
            <main className="live-main">
                <section className="stage" aria-label="Arena">
                    {error && <p className="stage-notice prose" role="alert">{error}</p>}
                    {playing && snapshot
                        ? <MatchReplay key={playing.matchId} snapshot={playing} msPerTurn={snapshot.msPerTurn} now={now} />
                        : <p className="stage-message">{!snapshot ? 'Connecting to the arena' : current ? phaseText(current) : 'Waiting for the next match'}</p>}
                </section>
                <aside className="board" aria-label="Lineup and odds">
                    <h2 className="board-title">Board</h2>
                    {current && current.phase !== 'scheduled'
                        ? <Lineup match={current} />
                        : <p className="board-foot">The lineup appears when the match opens.</p>}
                </aside>
            </main>
        </div>
    )
}
