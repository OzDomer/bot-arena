import { useCallback, useEffect, useState } from 'react'
import type { MatchSnapshot } from '../../shared/api'
import { formatCountdown } from '../../shared/countdown'
import { remainingMs } from '../../shared/liveTime'
import MatchReplay from './MatchReplay'
import { formatProbability, sortedOdds } from './odds'
import { useLive } from './useLive'

function Lineup({ match }: { match: Exclude<MatchSnapshot, { phase: 'scheduled' }> }) {
    return (
        <section className="live-panel" aria-label="Match lineup and probabilities">
            <ul className="live-lineup">
                {sortedOdds(match.lineup, match.odds).map(({ name, label }) => (
                    <li key={name}><span>{name}</span><strong>{label}</strong></li>
                ))}
            </ul>
            <p className="live-secondary">Draw {formatProbability(match.odds.draw)} · Timeout {formatProbability(match.odds.timeout)}</p>
            <p className="live-commitment">Commitment: <code title={match.commitHash}>{match.commitHash.slice(0, 16)}…</code></p>
        </section>
    )
}

function winnerText(winner: string): string {
    if (winner === 'draw') return 'Draw'
    if (winner === 'timeout') return 'Timeout'
    return `${winner} wins`
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
    const current = snapshot?.current

    return (
        <main className="live-page">
            <header className="live-header">
                <h1>Bot Arena · Live</h1>
                <span className="live-connection" role="status">Stream: {connection}</span>
            </header>
            {error && <p className="live-error" role="alert">{error}</p>}
            {!snapshot && <p>Loading live matches…</p>}
            {snapshot && !current && <p>Waiting for the next match</p>}
            {current && (
                <>
                    <div className="live-phase" aria-live="polite">
                        <strong>Match #{current.matchId}</strong>
                        {current.phase === 'scheduled' && <span>Opens in {countdown(current.opensAt)}</span>}
                        {current.phase === 'open' && <span>Bets open · closes in {countdown(current.closesAt)}</span>}
                        {current.phase === 'closed' && <span>Bets closed, revealing</span>}
                        {current.phase === 'revealed' && <span>Live playback</span>}
                        {current.phase === 'settled' && <span>Result: {winnerText(current.winner)}</span>}
                    </div>
                    {(current.phase === 'open' || current.phase === 'closed') && <Lineup match={current} />}
                </>
            )}
            {snapshot?.next && <p className="live-next">Next match opens in {countdown(snapshot.next.opensAt)}</p>}
            {snapshot && current && (current.phase === 'revealed' || current.phase === 'settled') && (
                <MatchReplay key={current.matchId} snapshot={current} msPerTurn={snapshot.msPerTurn} now={now} />
            )}
        </main>
    )
}
