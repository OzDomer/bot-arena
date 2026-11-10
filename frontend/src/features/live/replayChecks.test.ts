import { describe, expect, it } from 'vitest'
import { SIM_VERSION } from '@arena/sim'
import { checkReplay, replayWinner, type RevealedMatch } from './replayChecks'

const revealed: RevealedMatch = {
    matchId: 1,
    phase: 'revealed',
    opensAt: '2026-01-01T00:00:00.000Z',
    closesAt: '2026-01-01T00:01:00.000Z',
    startsAt: '2026-01-01T00:01:03.000Z',
    turns: 100,
    lineup: ['random', 'chaserV2'],
    preset: 'bigmap',
    simVersion: SIM_VERSION,
    odds: { wins: { random: 0.1, chaserV2: 0.7 }, draw: 0.1, timeout: 0.1 },
    commitHash: 'a'.repeat(64),
    secret: '12345678' + '00'.repeat(28),
}

describe('checkReplay', () => {
    it('allows verified descriptors, deriving the seed and preserving lineup order', () => {
        expect(checkReplay(revealed, 'verified')).toEqual({
            status: 'ready',
            descriptor: { lineup: ['random', 'chaserV2'], preset: 'bigmap', seed: 0x12345678 },
        })
        const reversed = { ...revealed, lineup: [...revealed.lineup].reverse() }
        expect(checkReplay(reversed, 'verified')).toMatchObject({ descriptor: { lineup: ['chaserV2', 'random'] } })
    })

    it('waits for commitment verification', () => {
        expect(checkReplay(revealed, 'checking')).toEqual({ status: 'checking' })
    })

    it('refuses a failed commitment check', () => {
        expect(checkReplay(revealed, 'failed')).toMatchObject({ status: 'error', message: expect.stringContaining('commitment') })
    })

    it('refuses a mismatched sim version even before hashing', () => {
        expect(checkReplay({ ...revealed, simVersion: 'unknown' }, 'checking'))
            .toMatchObject({ status: 'error', message: expect.stringContaining('version') })
    })

    it.each(['unknown', 'toString'])('refuses unknown entrant %s', name => {
        expect(checkReplay({ ...revealed, lineup: ['random', name] }, 'verified'))
            .toMatchObject({ status: 'error', message: expect.stringContaining('entrant') })
    })

    it.each(['unknown', 'toString'])('refuses unknown preset %s', preset => {
        expect(checkReplay({ ...revealed, preset }, 'verified'))
            .toMatchObject({ status: 'error', message: expect.stringContaining('preset') })
    })

    it('refuses malformed secret data', () => {
        expect(checkReplay({ ...revealed, secret: 'invalid' }, 'verified'))
            .toMatchObject({ status: 'error', message: expect.stringContaining('secret') })
    })

    it('refuses unusable playback timing', () => {
        expect(checkReplay({ ...revealed, startsAt: 'invalid' }, 'verified')).toMatchObject({ status: 'error' })
        expect(checkReplay({ ...revealed, turns: -1 }, 'verified')).toMatchObject({ status: 'error' })
    })

    it('also checks settled matches before showing their replay', () => {
        const settled: RevealedMatch = { ...revealed, phase: 'settled', winner: 'chaserV2', settledAt: revealed.startsAt }
        expect(checkReplay(settled, 'verified')).toMatchObject({ status: 'ready' })
        expect(checkReplay(settled, 'failed')).toMatchObject({ status: 'error' })
    })
})

describe('replayWinner', () => {
    it('maps the local winning seat to the entrant identity used by the server', () => {
        const winner = replayWinner({ result: { kind: 'win', winner: 2 }, names: { 1: 'random', 2: 'chaserV2' } })
        expect(winner).toBe('chaserV2')
        expect(winner === 'random').toBe(false)
    })

    it.each(['draw', 'timeout'] as const)('compares %s results directly', kind => {
        expect(replayWinner({ result: { kind }, names: {} })).toBe(kind)
    })
})
