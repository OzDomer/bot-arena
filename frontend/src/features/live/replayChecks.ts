import { isPresetName, seedFromSecret, SIM_VERSION, type PresetName } from '@arena/sim'
import { isEntrantName, type EntrantName } from '@arena/sim/bots'
import type { MatchSnapshot } from '../../shared/api'
import { secretFromHex } from '../../shared/hex'
import type { Match } from '../arena/buildMatch'

export type RevealedMatch = Extract<MatchSnapshot, { phase: 'revealed' | 'settled' }>
export type CommitmentStatus = 'checking' | 'verified' | 'failed'
export type ReplayDescriptor = { lineup: EntrantName[]; preset: PresetName; seed: number }
type ReplayCheck =
    | { status: 'error'; message: string }
    | { status: 'checking' }
    | { status: 'ready'; descriptor: ReplayDescriptor }

export function checkReplay(snapshot: RevealedMatch, commitment: CommitmentStatus): ReplayCheck {
    if (snapshot.simVersion !== SIM_VERSION) {
        return { status: 'error', message: `Replay unavailable: sim version ${snapshot.simVersion} differs from ${SIM_VERSION}.` }
    }
    const lineup = snapshot.lineup
    if (!lineup.every(isEntrantName)) {
        return { status: 'error', message: 'Replay unavailable: the lineup contains an unknown entrant.' }
    }
    const preset = snapshot.preset
    if (!isPresetName(preset)) {
        return { status: 'error', message: `Replay unavailable: unknown preset ${preset}.` }
    }
    if (!Number.isFinite(Date.parse(snapshot.startsAt)) || !Number.isInteger(snapshot.turns) || snapshot.turns < 0) {
        return { status: 'error', message: 'Replay unavailable: invalid playback timing.' }
    }
    let secret: Uint8Array<ArrayBuffer>
    try {
        secret = secretFromHex(snapshot.secret)
    } catch {
        return { status: 'error', message: 'Replay unavailable: invalid revealed secret.' }
    }
    if (commitment === 'checking') return { status: 'checking' }
    if (commitment === 'failed') return { status: 'error', message: 'Replay refused: commitment verification failed.' }
    return { status: 'ready', descriptor: { lineup, preset, seed: seedFromSecret(secret) } }
}

export function replayWinner(match: Pick<Match, 'result' | 'names'>): string {
    return match.result.kind === 'win' ? match.names[match.result.winner] : match.result.kind
}
