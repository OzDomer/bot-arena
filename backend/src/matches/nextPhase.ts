import { matches } from '../db/schema.ts'

export type MatchRow = typeof matches.$inferSelect
type Phase = MatchRow['phase']

export const REVEAL_LEAD_MS = 3_000
export const MS_PER_TURN = 150

export type PhaseUpdate = {
    phase: Phase
    startsAt?: Date
    settledAt?: Date
}

export function nextPhase(match: MatchRow, now: Date): PhaseUpdate {
    const t = now.getTime()
    const opensAt = match.opensAt.getTime()
    const closesAt = match.closesAt.getTime()
    const revealsAt = closesAt + REVEAL_LEAD_MS

    if (t < opensAt) return { phase: 'scheduled' }
    if (t < closesAt) return { phase: 'open' }
    if (t < revealsAt) return { phase: 'closed' }

    const startsAt = match.startsAt ?? new Date(revealsAt)
    const turns = match.turns ?? 0
    const endsAt = startsAt.getTime() + turns * MS_PER_TURN

    if (t < endsAt) return { phase: 'revealed', startsAt }
    return { phase: 'settled', startsAt, settledAt: new Date(endsAt) }
}