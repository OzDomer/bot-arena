import { chebyshev } from "../sim/geometry";
import { type Action, type Observation, DIRECTIONS } from "../types";
import { pickRandom } from "../util/random";
import { RandomizedBot } from "./RandomizedBot";

export class RandomBot extends RandomizedBot {

    decide(obs: Observation): Action {
        const move = pickRandom(DIRECTIONS, this.rng);
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        return { move, attack: target?.id };
    }
}   