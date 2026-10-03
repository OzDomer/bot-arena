import { chebyshev, directionToward, key } from "../sim/geometry";
import type { Observation, Action, Brain } from "../types";


export class CamperV1 implements Brain {

    decide(obs: Observation): Action {
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        if (key(obs.self.position) !== key(obs.storm.center)) {
            const move = directionToward(obs.self.position, obs.storm.center)
            return { move, attack: target?.id }
        }
        return { move: "STAY", attack: target?.id }
    }
}