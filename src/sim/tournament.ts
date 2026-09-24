import type { Entrant, } from "../types"
import { deriveSeed, makeRng, shuffle } from "../util/random"
import { runMatch } from "./match"
import { makeMatch } from "./setup"
import { addStats, emptyStats, MatchStats, type SeatStats } from "./stats"



export function runTournament(entrants: Entrant[], matches: number, seed: number): { tally: Record<string, number>, totals: SeatStats[] } {
    const tally: Record<string, number> = {}
    const totals: SeatStats[] = Array.from({ length: entrants.length }, emptyStats)

    for (let m = 0; m < matches; m++) {
        const matchSeed = deriveSeed(seed, 'match', m)
        const seating = shuffle(entrants.map((_, i) => i), makeRng(deriveSeed(matchSeed, 'seat')))
        const { world, brains } = makeMatch(seating.map(i => entrants[i]), matchSeed)
        const ms = new MatchStats(world)
        const final = runMatch(world, brains, (w, hits) => ms.onTurn(w, hits))
        const perMatch = ms.finish(final)
        for (const ship of final.ships) {
            addStats(totals[seating[ship.id - 1]], perMatch[ship.id])
        }
        const alive = final.ships.filter(s => s.hp > 0).map(s => s.id)
        let result: string
        if (alive.length === 1) result = entrants[seating[alive[0] - 1]].name
        else if (alive.length === 0) result = 'draw'
        else result = 'timeout'

        tally[result] = (tally[result] ?? 0) + 1
    }

    return { tally, totals }
}