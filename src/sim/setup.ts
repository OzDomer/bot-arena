import { DEFAULT_RULES, type Brain, type Entrant, type Rules, type Ship, type World } from "../types"
import { makeRng } from "../util/random";
import { mapCenter } from "./geometry";
import { makeShips, randomPositions } from "./spawn"

export function makeMatch(entrants: Entrant[], seed: number, rules: Rules = DEFAULT_RULES): { world: World; brains: Record<Ship['id'], Brain> } {
    const worldRng = makeRng(seed)
    const spawns = randomPositions(entrants.length, rules.width, rules.height, worldRng)
    const ships = makeShips(spawns, rules, worldRng)
    const world: World = { turn: 0, rules, ships, storm: { center: mapCenter(rules) } }
    const brains: Record<Ship['id'], Brain> = {}
    entrants.forEach((entrant, i) => {
        brains[i + 1] = entrant.make(makeRng(seed + i + 1))
    });
    return { world, brains }
}
