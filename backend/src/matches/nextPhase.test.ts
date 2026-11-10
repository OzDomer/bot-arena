import { describe, expect, it } from 'vitest'
import { endsAt as endsAtOf, MS_PER_TURN, nextPhase, PLAYBACK_DELAY_MS, REVEAL_LEAD_MS, type MatchRow } from './nextPhase.ts'

const at = (iso: string) => new Date(iso)

const base: MatchRow = {
    id: 1,
    lineupId: 1,
    phase: 'scheduled',
    secret: Buffer.alloc(32),
    commitHash: 'x',
    opensAt: at('2026-01-01T12:00:00Z'),
    closesAt: at('2026-01-01T12:05:00Z'),
    startsAt: null,
    winner: 'evo',
    turns: 100,
    settledAt: null,
    createdAt: at('2026-01-01T11:59:00Z'),
}

const revealsAt = new Date(base.closesAt.getTime() + REVEAL_LEAD_MS)
const startsAt = new Date(revealsAt.getTime() + PLAYBACK_DELAY_MS)
const endsAt = new Date(startsAt.getTime() + 100 * MS_PER_TURN)
const justBefore = (d: Date) => new Date(d.getTime() - 1)

describe('nextPhase', () => {
    it('is scheduled before opensAt', () => {
        expect(nextPhase(base, justBefore(base.opensAt)).phase).toBe('scheduled')
    })

    it('opens exactly at opensAt', () => {
        expect(nextPhase(base, base.opensAt).phase).toBe('open')
        expect(nextPhase(base, justBefore(base.closesAt)).phase).toBe('open')
    })

    it('closes exactly at closesAt', () => {
        expect(nextPhase(base, base.closesAt).phase).toBe('closed')
    })

    it('reveals at closesAt + REVEAL_LEAD_MS and starts playback PLAYBACK_DELAY_MS later', () => {
        const result = nextPhase(base, revealsAt)
        expect(result.phase).toBe('revealed')
        expect(result.startsAt).toEqual(startsAt)
        expect(startsAt.getTime() - revealsAt.getTime()).toBe(4_000)
    })

    it('is still closed one millisecond before the reveal', () => {
        expect(nextPhase(base, justBefore(revealsAt)).phase).toBe('closed')
    })

    it('stays revealed through the delay before the first frame', () => {
        const result = nextPhase(base, justBefore(startsAt))
        expect(result.phase).toBe('revealed')
        expect(result.startsAt).toEqual(startsAt)
    })

    it('keeps a stored startsAt instead of recomputing it', () => {
        const stored = at('2026-01-01T12:05:03Z')
        const result = nextPhase({ ...base, startsAt: stored }, at('2026-01-01T12:05:10Z'))
        expect(result.phase).toBe('revealed')
        expect(result.startsAt).toEqual(stored)
    })

    it('stays revealed until the last turn has played', () => {
        expect(nextPhase(base, justBefore(endsAt)).phase).toBe('revealed')
    })

    it('settles at startsAt + turns * MS_PER_TURN', () => {
        const result = nextPhase(base, endsAt)
        expect(result.phase).toBe('settled')
        expect(result.settledAt).toEqual(endsAt)
        expect(result.startsAt).toEqual(startsAt)
    })

    it('settles from a stored startsAt, not a recomputed one', () => {
        const stored = at('2026-01-01T12:06:00Z')
        const storedEnd = new Date(stored.getTime() + 100 * MS_PER_TURN)
        expect(nextPhase({ ...base, startsAt: stored }, justBefore(storedEnd)).phase).toBe('revealed')
        expect(nextPhase({ ...base, startsAt: stored }, storedEnd).settledAt).toEqual(storedEnd)
    })
})

describe('endsAt', () => {
    it('counts the reveal lead, the playback delay and every turn before the match has started', () => {
        expect(endsAtOf(base)).toBe(endsAt.getTime())
    })

    it('uses the stored startsAt once there is one', () => {
        const stored = at('2026-01-01T12:06:00Z')
        expect(endsAtOf({ ...base, startsAt: stored })).toBe(stored.getTime() + 100 * MS_PER_TURN)
    })

    it('agrees with the moment nextPhase settles the match', () => {
        expect(nextPhase(base, new Date(endsAtOf(base))).phase).toBe('settled')
        expect(nextPhase(base, new Date(endsAtOf(base) - 1)).phase).toBe('revealed')
    })
})
