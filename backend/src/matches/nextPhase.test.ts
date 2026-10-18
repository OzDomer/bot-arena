import { describe, expect, it } from 'vitest'
import { MS_PER_TURN, nextPhase, REVEAL_LEAD_MS, type MatchRow } from './nextPhase.ts'

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
const endsAt = new Date(revealsAt.getTime() + 100 * MS_PER_TURN)
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

    it('reveals at closesAt + REVEAL_LEAD_MS and decides startsAt', () => {
        const result = nextPhase(base, revealsAt)
        expect(result.phase).toBe('revealed')
        expect(result.startsAt).toEqual(revealsAt)
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
        expect(result.startsAt).toEqual(revealsAt)
    })
})