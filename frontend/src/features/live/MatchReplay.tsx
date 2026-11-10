import { useEffect, useMemo, useState } from 'react'
import { entrant } from '@arena/sim/bots'
import Arena from '../arena/Arena'
import { buildMatch } from '../arena/buildMatch'
import type { FrameReport } from '../arena/frameReport'
import { matchesCommitment } from '../../shared/commitment'
import { secretFromHex } from '../../shared/hex'
import { checkReplay, replayWinner, type CommitmentStatus, type ReplayDescriptor, type RevealedMatch } from './replayChecks'

// The frame on screen plus how this browser's own run of the match ended.
export type LiveFrame = FrameReport & { localWinner: string }

type ReplayProps = {
    snapshot: RevealedMatch
    msPerTurn: number
    now: () => number
    onFrame: (frame: LiveFrame) => void
}

function VerifiedReplay({ snapshot, msPerTurn, now, onFrame, descriptor }: ReplayProps & { descriptor: ReplayDescriptor }) {
    // The parent is keyed by matchId; its immutable descriptor is simulated once.
    const [match] = useState(() => buildMatch(descriptor.lineup.map(entrant), descriptor.seed, descriptor.preset))
    const settled = snapshot.phase === 'settled'
    const live = useMemo(() => ({ startsAt: Date.parse(snapshot.startsAt), msPerTurn, now, settled }),
        [snapshot.startsAt, msPerTurn, now, settled])
    const localWinner = replayWinner(match)

    return (
        <div className="stage-arena">
            <Arena match={match} live={live} onFrame={report => onFrame({ ...report, localWinner })} />
            <p className="stage-verified" title={`sha256 of the revealed secret equals ${snapshot.commitHash}`}>
                <span className="check" aria-hidden="true" />
                commitment verified
            </p>
        </div>
    )
}

function ReplayProblem({ message }: { message: string }) {
    return (
        <div className="stage-fill stage-grid">
            <p className="stage-problem prose" role="alert">{message}</p>
        </div>
    )
}

export default function MatchReplay({ snapshot, msPerTurn, now, onFrame }: ReplayProps) {
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

    if (check.status === 'error') return <ReplayProblem message={check.message} />
    if (!(msPerTurn > 0) || !Number.isFinite(msPerTurn)) return <ReplayProblem message="Replay unavailable: invalid turn duration." />
    if (check.status === 'checking') {
        return (
            <div className="stage-fill stage-grid">
                <p className="stage-message" role="status">Verifying the commitment</p>
            </div>
        )
    }
    return <VerifiedReplay snapshot={snapshot} msPerTurn={msPerTurn} now={now} onFrame={onFrame} descriptor={check.descriptor} />
}
