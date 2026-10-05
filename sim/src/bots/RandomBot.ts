import { chebyshev } from "../sim/geometry.ts";
import { type Action, type Observation, DIRECTIONS } from "../types.ts";
import { pickRandom } from "../util/random.ts";
import { RandomizedBot } from "./RandomizedBot.ts";

export class RandomBot extends RandomizedBot {

    decide(obs: Observation): Action {
        const move = pickRandom(DIRECTIONS, this.rng);
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        return { move, attack: target?.id };
    }
}   