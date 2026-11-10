import { useEffect, useMemo, useState } from 'react'
import { entrant } from '@arena/sim/bots'
import Arena from '../arena/Arena'
import { buildMatch } from '../arena/buildMatch'
import { matchesCommitment } from '../../shared/commitment'
import { secretFromHex } from '../../shared/hex'
import { checkReplay, replayWinner, type CommitmentStatus, type ReplayDescriptor, type RevealedMatch } from './replayChecks'

type ReplayProps = { snapshot: RevealedMatch; msPerTurn: number; now: () => number }

function VerifiedReplay({ snapshot, msPerTurn, now, descriptor }: ReplayProps & { descriptor: ReplayDescriptor }) {
    // The parent is keyed by matchId; its immutable descriptor is simulated once.
    const [match] = useState(() => buildMatch(descriptor.lineup.map(entrant), descriptor.seed, descriptor.preset))
    const settled = snapshot.phase === 'settled'
    const live = useMemo(() => ({ startsAt: Date.parse(snapshot.startsAt), msPerTurn, now, settled }),
        [snapshot.startsAt, msPerTurn, now, settled])
    const localWinner = replayWinner(match)

    return (
        <>
            {settled && snapshot.winner !== localWinner && (
                <p className="live-error" role="alert">
                    Replay mismatch: server result is {snapshot.winner}; local replay is {localWinner}.
                </p>
            )}
            <Arena match={match} live={live} />
        </>
    )
}

export default function MatchReplay({ snapshot, msPerTurn, now }: ReplayProps) {
    const { secret, commitHash } = snapshot
    const [verification, setVerification] = useState<{ secret: string; commitHash: string; status: CommitmentStatus } | null>(null)
    const commitment = verification?.secret === secret && verification.commitHash === commitHash ? verification.status : 'checking'
    const check = checkReplay(snapshot, commitment)

    useEffect(() => {
        let active = true
        const finish = (status: CommitmentStatus) => {
            if (active) setVerification({ secret, commitHash, status })
        }
        void (async () => {
            try {
                finish(await matchesCommitment(secretFromHex(secret), commitHash) ? 'verified' : 'failed')
            } catch {
                finish('failed')
            }
        })()
        return () => { active = false }
    }, [secret, commitHash])

    if (check.status === 'error') return <p className="live-error" role="alert">{check.message}</p>
    if (!(msPerTurn > 0) || !Number.isFinite(msPerTurn)) {
        return <p className="live-error" role="alert">Replay unavailable: invalid turn duration.</p>
    }
    if (check.status === 'checking') return <p role="status">Verifying commitment…</p>
    return <VerifiedReplay snapshot={snapshot} msPerTurn={msPerTurn} now={now} descriptor={check.descriptor} />
}
