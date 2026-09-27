import { chebyshev } from "../sim/geometry";
import { DIRECTIONS, type Action, type Brain, type Observation } from "../types";
import { encode } from "./encode";
import { forward, type Weights, argMax, OUTPUTS, INPUTS } from "./net";

export class NetBrain implements Brain {
    protected weights: Weights
    constructor(weights: Weights) {
        this.weights = weights;
        if (weights.length !== OUTPUTS || weights.some(r => r.length !== INPUTS + 1))
            throw new Error(`NetBrain: expected ${OUTPUTS}x${INPUTS + 1} weights, got ${weights.length}x${weights[0]?.length}`)
    }

    decide(obs: Observation): Action {
        const forwardResult = forward(this.weights, encode(obs))
        const index = argMax(forwardResult)
        const move = DIRECTIONS[index]
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        return { move, attack: target?.id }
    }

}
