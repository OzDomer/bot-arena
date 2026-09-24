import { DEFAULT_RULES, type Brain, type Entrant, type Rules, type Ship, type World } from "../types"
import { deriveSeed, makeRng } from "../util/random";
import { mapCenter } from "./geometry";
import { makeShips, randomPositions } from "./spawn"

export function makeMatch(entrants: Entrant[], seed: number, rules: Rules = DEFAULT_RULES): { world: World; brains: Record<Ship['id'], Brain> } {
    const worldRng = makeRng(deriveSeed(seed, 'world'))
    const spawns = randomPositions(entrants.length, rules.width, rules.height, worldRng)
    const ships = makeShips(spawns, rules, worldRng)
    const world: World = { turn: 0, rules, ships, storm: { center: mapCenter(rules) } }
    const brains: Record<Ship['id'], Brain> = {}
    entrants.forEach((entrant, i) => {
        brains[i + 1] = entrant.make(makeRng(deriveSeed(seed, 'bot', i)))
    });
    return { world, brains }
}
