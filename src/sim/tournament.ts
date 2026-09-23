import type { Entrant, } from "../types"
import { runMatch } from "./match"
import { makeMatch } from "./setup"


export function runTournament(entrants: Entrant[], matches: number, seed: number): Record<string, number> {
    const tally: Record<string, number> = {}

    for (let m = 0; m < matches; m++) {
        const { world, brains } = makeMatch(entrants, seed + m)
        const final = runMatch(world, brains)
        const alive = final.ships.filter(s => s.hp > 0).map(s => s.id)
        let result: string
        if (alive.length === 1) result = entrants[alive[0] - 1].name
        else if (alive.length === 0) result = 'draw'
        else result = 'timeout'

        tally[result] = (tally[result] ?? 0) + 1
    }

    return tally;
}