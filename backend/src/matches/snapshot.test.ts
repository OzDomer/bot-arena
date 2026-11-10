import { describe, expect, it } from 'vitest'
import { MS_PER_TURN, type MatchRow } from './nextPhase.ts'
import { liveSnapshotOf, snapshotOf, type LineupRow, type LiveEntry } from './snapshot.ts'

type Phase = MatchRow['phase']

const SECRET_HEX = 'c0ffee'.padEnd(64, 'ab')
const secret = Buffer.from(SECRET_HEX, 'hex')

const lineup: LineupRow = {
    id: 3,
    names: ['camperV2', 'evo', 'random'],
    preset: 'bigmap',
    simVersion: '1',
    odds: { wins: { camperV2: 0.5, evo: 0.3, random: 0.1 }, draw: 0.1, timeout: 0 },
    sampleSize: 2000,
    createdAt: new Date('2026-01-01T11:00:00Z'),
}

// The worst case for a leak: every column is filled in, whatever the phase.
// This is also what a real row looks like for winner and secret, which are
// stored at creation.
function entry(phase: Phase, id = 7): LiveEntry {
    return {
        lineup,
        match: {
            id,
            lineupId: lineup.id,
            phase,
            secret,
            commitHash: 'the-commit-hash',
            opensAt: new Date('2026-01-01T12:00:00Z'),
            closesAt: new Date('2026-01-01T12:05:00Z'),
            startsAt: new Date('2026-01-01T12:05:03Z'),
            turns: 42,
            winner: 'evo',
            settledAt: new Date('2026-01-01T12:05:09.300Z'),
            createdAt: new Date('2026-01-01T11:59:00Z'),
        },
    }
}

const SCHEDULED = ['matchId', 'opensAt', 'phase']
const BETTING = [...SCHEDULED, 'closesAt', 'commitHash', 'lineup', 'odds', 'preset', 'simVersion']
const PLAYBACK = [...BETTING, 'secret', 'startsAt', 'turns']
const SETTLED = [...PLAYBACK, 'settledAt', 'winner']

const PUBLIC_KEYS: Record<Phase, string[]> = {
    scheduled: SCHEDULED,
    open: BETTING,
    closed: BETTING,
    revealed: PLAYBACK,
    settled: SETTLED,
}

const PHASES = Object.keys(PUBLIC_KEYS) as Phase[]
const BEFORE_REVEALED: Phase[] = ['scheduled', 'open', 'closed']
const BEFORE_SETTLED: Phase[] = [...BEFORE_REVEALED, 'revealed']

describe('snapshotOf', () => {
    it.each(PHASES)('%s exposes exactly its public fields', (phase) => {
        const snapshot = snapshotOf(entry(phase))
        expect(Object.keys(snapshot).toSorted()).toEqual(PUBLIC_KEYS[phase].toSorted())
        expect(snapshot.phase).toBe(phase)
    })

    it.each(BEFORE_REVEALED)('%s: secret, startsAt and turns are absent, not null', (phase) => {
        const snapshot = snapshotOf(entry(phase))
        expect(snapshot).not.toHaveProperty('secret')
        expect(snapshot).not.toHaveProperty('seed')
        expect(snapshot).not.toHaveProperty('startsAt')
        expect(snapshot).not.toHaveProperty('turns')
    })

    it.each(BEFORE_REVEALED)('%s: the secret is nowhere in the serialized snapshot', (phase) => {
        const wire = JSON.stringify(snapshotOf(entry(phase)))
        expect(wire).not.toContain(SECRET_HEX)
        expect(wire).not.toContain(secret.toString('base64'))
        expect(wire).not.toContain('"type":"Buffer"')
    })

    it.each(BEFORE_SETTLED)('%s: winner and settledAt are absent, not null', (phase) => {
        const snapshot = snapshotOf(entry(phase))
        expect(snapshot).not.toHaveProperty('winner')
        expect(snapshot).not.toHaveProperty('settledAt')
    })

    it('scheduled publishes only the id, the phase and when it opens', () => {
        expect(snapshotOf(entry('scheduled'))).toEqual({
            matchId: 7,
            phase: 'scheduled',
            opensAt: '2026-01-01T12:00:00.000Z',
        })
    })

    it.each(['open', 'closed'] as const)('%s publishes the lineup, odds and commitment', (phase) => {
        expect(snapshotOf(entry(phase))).toEqual({
            matchId: 7,
            phase,
            opensAt: '2026-01-01T12:00:00.000Z',
            closesAt: '2026-01-01T12:05:00.000Z',
            lineup: ['camperV2', 'evo', 'random'],
            preset: 'bigmap',
            simVersion: '1',
            odds: lineup.odds,
            commitHash: 'the-commit-hash',
        })
    })

    it('revealed adds the secret as hex, startsAt and turns', () => {
        expect(snapshotOf(entry('revealed'))).toMatchObject({
            phase: 'revealed',
            secret: SECRET_HEX,
            startsAt: '2026-01-01T12:05:03.000Z',
            turns: 42,
        })
    })

    it('settled adds the winner and settledAt', () => {
        expect(snapshotOf(entry('settled'))).toMatchObject({
            phase: 'settled',
            secret: SECRET_HEX,
            winner: 'evo',
            settledAt: '2026-01-01T12:05:09.300Z',
        })
    })

    it('refuses a revealed match that has no startsAt', () => {
        const broken = entry('revealed')
        broken.match.startsAt = null
        expect(() => snapshotOf(broken)).toThrow('startsAt')
    })

    it('refuses a settled match that has no winner', () => {
        const broken = entry('settled')
        broken.match.winner = null
        expect(() => snapshotOf(broken)).toThrow('winner')
    })
})

describe('liveSnapshotOf', () => {
    const now = new Date('2026-01-01T12:01:00Z')

    it('is empty when nothing is live', () => {
        expect(liveSnapshotOf([], now)).toEqual({
            now: '2026-01-01T12:01:00.000Z',
            msPerTurn: MS_PER_TURN,
            current: null,
            next: null,
        })
    })

    it('has only next before the first match opens', () => {
        const live = liveSnapshotOf([entry('scheduled', 1)], now)
        expect(live.current).toBeNull()
        expect(live.next).toEqual({ matchId: 1, phase: 'scheduled', opensAt: '2026-01-01T12:00:00.000Z' })
    })

    it.each(['open', 'closed', 'revealed'] as const)('current is the %s match and next the scheduled one', (phase) => {
        const live = liveSnapshotOf([entry(phase, 1), entry('scheduled', 2)], now)
        expect(live.current).toMatchObject({ matchId: 1, phase })
        expect(live.next).toMatchObject({ matchId: 2, phase: 'scheduled' })
    })

    it('keeps a settled match as current while nothing else has opened', () => {
        const live = liveSnapshotOf([entry('settled', 1), entry('scheduled', 2)], now)
        expect(live.current).toMatchObject({ matchId: 1, phase: 'settled' })
        expect(live.next).toMatchObject({ matchId: 2 })
    })

    it('prefers a match that has opened over a settled one still held', () => {
        const live = liveSnapshotOf([entry('settled', 1), entry('open', 2), entry('scheduled', 3)], now)
        expect(live.current).toMatchObject({ matchId: 2, phase: 'open' })
        expect(live.next).toMatchObject({ matchId: 3 })
    })

    it('has no next while no match is scheduled', () => {
        const live = liveSnapshotOf([entry('open', 1)], now)
        expect(live.current).toMatchObject({ matchId: 1 })
        expect(live.next).toBeNull()
    })

    it('never lets the next match carry more than a scheduled snapshot', () => {
        const live = liveSnapshotOf([entry('revealed', 1), entry('scheduled', 2)], now)
        expect(Object.keys(live.next!).toSorted()).toEqual(SCHEDULED.toSorted())
    })
})
