import type { MatchSnapshot } from '../../shared/api'
import { formatCountdown } from '../../shared/countdown'
import HashChip from './HashChip'
import MatchReplay, { type LiveFrame } from './MatchReplay'
import ResultBand, { type Result } from './ResultBand'
import { isUrgent, startCue } from './stageClock'
import type { ConnectionStatus } from './useLive'

function HeroCountdown({ label, remaining }: { label: string; remaining: number }) {
    const text = formatCountdown(remaining)
    return (
        <>
            <p className="hero-label">{label}</p>
            {/* keyed by its text: each new second gets one short tick */}
            <p className="hero-digits" data-urgent={isUrgent(remaining) || undefined} role="timer" aria-label={`${label} ${text}`}>
                <span key={text}>{text}</span>
            </p>
        </>
    )
}

type StageProps = {
    current: MatchSnapshot | null
    next: MatchSnapshot | null
    // false until the first snapshot arrives
    ready: boolean
    connection: ConnectionStatus
    error: string | null
    serverNow: number
    msPerTurn: number
    now: () => number
    onFrame: (frame: LiveFrame) => void
    result: Result | null
    leavingResult: Result | null
}

// The large area. It counts down while bets are open, plays the match once
// the seed is out, and carries the result across its lower third.
export default function Stage({ current, next, ready, connection, error, serverNow, msPerTurn, now, onFrame, result, leavingResult }: StageProps) {
    const left = (iso: string) => Date.parse(iso) - serverNow
    const cue = current?.phase === 'revealed' ? startCue(left(current.startsAt)) : null
    const band = result ?? leavingResult
    const stale = ready && connection !== 'connected'

    return (
        <section className="stage" data-phase={current?.phase ?? 'none'} aria-label="Arena">
            {error && !ready && <p className="stage-notice prose" data-tone="error" role="alert">{error}</p>}
            {stale && (
                <p className="stage-notice prose" data-tone="warn" role="status">
                    The stream dropped. This is the last state received; it updates as soon as the connection is back.
                </p>
            )}

            {!ready && (
                <div className="stage-fill stage-grid">
                    <p className="stage-message" role="status">Connecting to the arena</p>
                </div>
            )}

            {ready && !current && (
                <div className="stage-fill stage-grid">
                    {next
                        ? <HeroCountdown label="first match opens in" remaining={left(next.opensAt)} />
                        : <p className="stage-message" role="status">Waiting for the first match</p>}
                </div>
            )}

            {current?.phase === 'open' && (
                <div className="stage-fill stage-grid">
                    <HeroCountdown label="bets close in" remaining={left(current.closesAt)} />
                    <HashChip hash={current.commitHash} />
                    <p className="hero-note prose">
                        The match is already decided by a secret only the server knows. Its hash is public now; the secret follows when bets close, and this page checks one against the other before it plays anything.
                    </p>
                </div>
            )}

            {current?.phase === 'closed' && (
                <div className="stage-fill stage-grid">
                    <p className="hero-label">bets closed</p>
                    <p className="hero-word">Revealing<br />the seed</p>
                    <span className="hero-sweep" aria-hidden="true" />
                    <HashChip hash={current.commitHash} />
                </div>
            )}

            {current && (current.phase === 'revealed' || current.phase === 'settled') && (
                <MatchReplay key={`replay-${current.matchId}`} snapshot={current} msPerTurn={msPerTurn} now={now} onFrame={onFrame} />
            )}

            {cue && (
                <div className="stage-cue" role="status">
                    {cue === 'ready'
                        ? <span className="stage-cue-word">seed revealed</span>
                        : <span className="stage-cue-digit" key={cue}>{cue}</span>}
                </div>
            )}

            {band && (
                <ResultBand
                    key={`result-${band.matchId}`}
                    result={band}
                    leaving={!result}
                    next={next ? formatCountdown(left(next.opensAt)) : null}
                />
            )}
        </section>
    )
}
