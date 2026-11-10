import type { lineups, Odds } from '../db/schema.ts'
import { MS_PER_TURN, type MatchRow } from './nextPhase.ts'

export type LineupRow = typeof lineups.$inferSelect
export type LiveEntry = { match: MatchRow; lineup: LineupRow }

type Scheduled = {
    matchId: number
    phase: 'scheduled'
    opensAt: string
}

type Betting = {
    matchId: number
    opensAt: string
    closesAt: string
    lineup: string[]
    preset: string
    simVersion: string
    odds: Odds
    commitHash: string
}

type Open = Betting & { phase: 'open' | 'closed' }

type Playback = Betting & {
    secret: string
    startsAt: string
    turns: number
}

type Revealed = Playback & { phase: 'revealed' }

type Settled = Playback & {
    phase: 'settled'
    winner: string
    settledAt: string
}

export type MatchSnapshot = Scheduled | Open | Revealed | Settled

export type LiveSnapshot = {
    now: string
    msPerTurn: number
    current: MatchSnapshot | null
    next: MatchSnapshot | null
}

// The only place a match row becomes something a client may see. Every
// field is copied by name, phase by phase, so a column added to the table
// stays private until it is listed here. The row always holds the secret
// and the winner; what decides whether they are public is the phase.
export function snapshotOf({ match, lineup }: LiveEntry): MatchSnapshot {
    const matchId = match.id
    const opensAt = match.opensAt.toISOString()

    if (match.phase === 'scheduled') return { matchId, phase: match.phase, opensAt }

    const betting: Betting = {
        matchId,
        opensAt,
        closesAt: match.closesAt.toISOString(),
        lineup: lineup.names,
        preset: lineup.preset,
        simVersion: lineup.simVersion,
        odds: lineup.odds,
        commitHash: match.commitHash,
    }

    if (match.phase === 'open' || match.phase === 'closed') return { ...betting, phase: match.phase }

    if (match.startsAt === null || match.turns === null) {
        throw new Error(`match ${matchId} is ${match.phase} without startsAt or turns`)
    }
    const playback: Playback = {
        ...betting,
        secret: match.secret.toString('hex'),
        startsAt: match.startsAt.toISOString(),
        turns: match.turns,
    }

    if (match.phase === 'revealed') return { ...playback, phase: match.phase }

    if (match.winner === null || match.settledAt === null) {
        throw new Error(`match ${matchId} is settled without winner or settledAt`)
    }
    return {
        ...playback,
        phase: match.phase,
        winner: match.winner,
        settledAt: match.settledAt.toISOString(),
    }
}

// current: the match the public is looking at. A match that is open, closed
// or playing wins over one that is only still on screen for its result.
// next: the first match that has not opened yet.
export function liveSnapshotOf(entries: readonly LiveEntry[], now: Date): LiveSnapshot {
    const active = entries.find(({ match }) => match.phase !== 'scheduled' && match.phase !== 'settled')
    const held = entries.findLast(({ match }) => match.phase === 'settled')
    const current = active ?? held
    const next = entries.find(({ match }) => match.phase === 'scheduled')

    return {
        now: now.toISOString(),
        msPerTurn: MS_PER_TURN,
        current: current ? snapshotOf(current) : null,
        next: next ? snapshotOf(next) : null,
    }
}
