import type { Brain, Entrant, Ship, World } from "../types"
import { makeRng } from "../util/random";
import { makeShips, randomPositions } from "./spawn"

export function makeMatch(entrants: Entrant[], seed: number): { world: World; brains: Record<Ship['id'], Brain> } {
    const worldRng = makeRng(seed)
    const spawns = randomPositions(entrants.length, 10, 10, worldRng)
    const ships = makeShips(spawns, worldRng)
    const world: World = { turn: 0, turnCap: 200, width: 10, height: 10, ships }
    const brains: Record<Ship['id'], Brain> = {}
    entrants.forEach((entrant, i) => {
        brains[i + 1] = entrant.make(makeRng(seed + i + 1))
    });
    return { world, brains }
}
