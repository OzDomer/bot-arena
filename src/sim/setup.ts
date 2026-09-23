import type { Brain, Entrant, Ship, World } from "../types";
import { type Rng } from "../util/random";
import { makeShips, randomPositions } from "./spawn";

export function makeMatch(entrants: Entrant[], rng: Rng): { world: World; brains: Record<Ship['id'], Brain> } {
    const spawns = randomPositions(entrants.length, 10, 10, rng)
    const ships = makeShips(spawns, rng)
    const world: World = { turn: 0, turnCap: 200, width: 10, height: 10, ships }
    const brains: Record<Ship['id'], Brain> = {}
    entrants.forEach((entrant, i) => {
        brains[i + 1] = entrant.make(rng)
    });
    return { world, brains }
}
