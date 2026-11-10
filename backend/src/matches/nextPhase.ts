import { matches } from '../db/schema.ts'

export type MatchRow = typeof matches.$inferSelect
type Phase = MatchRow['phase']

export const REVEAL_LEAD_MS = 3_000
// how long after the reveal frame 0 plays, so clients have the seed and
// the match built before playback starts
export const PLAYBACK_DELAY_MS = 4_000
// how long a settled match stays on screen before the next one opens
export const RESULT_HOLD_MS = 8_000
export const MS_PER_TURN = 150

export type PhaseUpdate = {
    phase: Phase
    startsAt?: Date
    settledAt?: Date
}

export function endsAt(match: MatchRow): number {
    const revealsAt = match.closesAt.getTime() + REVEAL_LEAD_MS
    const startsAt = match.startsAt?.getTime() ?? revealsAt + PLAYBACK_DELAY_MS
    return startsAt + (match.turns ?? 0) * MS_PER_TURN
}

export function holdEndsAt(match: MatchRow): number {
    return endsAt(match) + RESULT_HOLD_MS
}

export function nextPhase(match: MatchRow, now: Date): PhaseUpdate {
    const t = now.getTime()
    const opensAt = match.opensAt.getTime()
    const closesAt = match.closesAt.getTime()
    const revealsAt = closesAt + REVEAL_LEAD_MS

    if (t < opensAt) return { phase: 'scheduled' }
    if (t < closesAt) return { phase: 'open' }
    if (t < revealsAt) return { phase: 'closed' }

    const startsAt = match.startsAt ?? new Date(revealsAt + PLAYBACK_DELAY_MS)
    const turns = match.turns ?? 0
    const endsAt = startsAt.getTime() + turns * MS_PER_TURN

    if (t < endsAt) return { phase: 'revealed', startsAt }
    return { phase: 'settled', startsAt, settledAt: new Date(endsAt) }
}