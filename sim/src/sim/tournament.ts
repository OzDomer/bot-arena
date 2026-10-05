import { DEFAULT_RULES, type Entrant, type Rules } from "../types.ts"
import { deriveSeed } from "../util/random.ts"
import { outcome } from "./outcome.ts"
import { playMatch } from "./playMatch.ts"
import { addStats, emptyStats, type SeatStats } from "./stats.ts"



export function runTournament(entrants: Entrant[], matches: number, seed: number, rules: Rules = DEFAULT_RULES): { tally: Record<string, number>, totals: SeatStats[] } {
    const tally: Record<string, number> = {}
    const totals: SeatStats[] = Array.from({ length: entrants.length }, emptyStats)
    for (let m = 0; m < matches; m++) {
        const matchSeed = deriveSeed(seed, 'match', m)
        const { final, perMatch, seating } = playMatch(entrants, matchSeed, rules)
        for (const ship of final.ships) {
            addStats(totals[seating[ship.id - 1]], perMatch[ship.id])
        }
        const result = outcome(final)
        const key = result.kind === "win" ? entrants[seating[result.winner - 1]].name : result.kind
        tally[key] = (tally[key] ?? 0) + 1
    }

    return { tally, totals }
}