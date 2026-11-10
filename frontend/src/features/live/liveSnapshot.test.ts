import { describe, expect, it } from 'vitest'
import type { LiveSnapshot, MatchSnapshot } from '../../shared/api'
import { newerSnapshot } from './liveSnapshot'

const open: MatchSnapshot = {
    matchId: 1,
    phase: 'open',
    opensAt: '2026-01-01T00:00:00.000Z',
    closesAt: '2026-01-01T00:01:00.000Z',
    lineup: ['random', 'chaserV2'],
    preset: 'bigmap',
    simVersion: '1',
    odds: { wins: { random: 0.1, chaserV2: 0.7 }, draw: 0.1, timeout: 0.1 },
    commitHash: 'a'.repeat(64),
}

function snapshot(time: number, current: MatchSnapshot | null = open, next: MatchSnapshot | null = null): LiveSnapshot {
    return { now: new Date(time).toISOString(), msPerTurn: 150, current, next }
}

describe('newerSnapshot', () => {
    it('accepts the first snapshot', () => {
        const incoming = snapshot(1_000, null)
        expect(newerSnapshot(null, incoming)).toBe(incoming)
    })

    it('accepts a newer full snapshot', () => {
        const incoming = snapshot(2_000)
        expect(newerSnapshot(snapshot(1_000, null), incoming)).toBe(incoming)
    })

    it('keeps the stream state when an earlier HTTP response arrives late', () => {
        const streamed = snapshot(2_000, { ...open, phase: 'closed' })
        expect(newerSnapshot(streamed, snapshot(1_000))).toBe(streamed)
    })

    it('accepts a later match and rejects an older one at the same timestamp', () => {
        const first = snapshot(1_000)
        const second = snapshot(1_000, { ...open, matchId: 2 })
        expect(newerSnapshot(first, second)).toBe(second)
        expect(newerSnapshot(second, first)).toBe(second)
    })

    it('advances phases in the same millisecond without rolling them back', () => {
        const opened = snapshot(1_000)
        const closed = snapshot(1_000, { ...open, phase: 'closed' })
        expect(newerSnapshot(opened, closed)).toBe(closed)
        expect(newerSnapshot(closed, opened)).toBe(closed)
    })

    it('accepts a newly scheduled next match at the same timestamp', () => {
        const current = snapshot(1_000)
        const scheduled = snapshot(1_000, open, { matchId: 2, phase: 'scheduled', opensAt: open.closesAt })
        expect(newerSnapshot(current, scheduled)).toBe(scheduled)
        expect(newerSnapshot(scheduled, current)).toBe(scheduled)
    })

    it('retains the existing snapshot on a tie', () => {
        const current = snapshot(1_000)
        expect(newerSnapshot(current, snapshot(1_000))).toBe(current)
    })
})
