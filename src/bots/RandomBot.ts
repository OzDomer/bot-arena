import { chebyshev } from "../sim/geometry";
import { type Action, type Brain, type Observation, type Direction, DELTAS } from "../types";
import { pickRandom } from "../util/random";

const DIRECTIONS = Object.keys(DELTAS) as Direction[]
export class RandomBot implements Brain {
    decide(obs: Observation): Action {
        const move = pickRandom(DIRECTIONS);
        const target = obs.visibleShips.find(ship => chebyshev(obs.self.position, ship.position) <= obs.self.attackRange);
        return { move, attack: target?.id };
    }
}