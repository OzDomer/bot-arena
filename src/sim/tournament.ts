import type { Brain, Ship, World } from "../types";
import { makeRng, type Rng } from "../util/random";
import { runMatch } from "./match";
import { makeShips, randomPositions } from "./spawn";

type Entrant = { name: string; make: (rng: Rng) => Brain };

export function runTournament(entrants: Entrant[], matches: number, seed: number): Record<string, number> {
    const tally: Record<string, number> = {};

    for (let m = 0; m < matches; m++) {
        const rng = makeRng(seed + m);
        const spawns = randomPositions(entrants.length, 10, 10, rng)
        const ships = makeShips(spawns)
        const world: World = { turn: 0, turnCap: 200, width: 10, height: 10, ships }
        const brains: Record<Ship['id'], Brain> = {};
        entrants.forEach((entrant, i) => {
            brains[i + 1] = entrant.make(rng);
        });
        const final = runMatch(world, brains)
        const alive = final.ships.filter(s => s.hp > 0).map(s => s.id)
        let result: string;
        if (alive.length === 1) result = entrants[alive[0] - 1].name;
        else if (alive.length === 0) result = 'draw';
        else result = 'timeout';

        tally[result] = (tally[result] ?? 0) + 1;
    }

    return tally;
}