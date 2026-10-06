import { describe, expect, it } from 'vitest'
import { hash } from 'node:crypto'
import { runTournament } from './sim/tournament.ts'
import { showcase } from './roster.ts'
import { PRESETS } from './sim/presets.ts'
import { SIM_VERSION } from './version.ts'

const GOLDEN: Record<string, string> = {
    '1': 'bf9494442038',
}

function fingerprint(): string {
    const totals = runTournament(showcase, 500, 1, PRESETS.bigmap)
    return hash('sha256', JSON.stringify(totals)).slice(0, 12)
}

describe('SIM_VERSION', () => {
    it('matches the golden fingerprint for this version', () => {
        expect(fingerprint()).toBe(GOLDEN[SIM_VERSION])
    })

    it('is deterministic: same tournament, same fingerprint', () => {
        expect(fingerprint()).toBe(fingerprint())
    })
})