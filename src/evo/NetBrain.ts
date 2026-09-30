import { chebyshev } from "../sim/geometry";
import { DIRECTIONS, type Action, type Brain, type Observation } from "../types";
import { encode, versionFor } from "./encode";
import { forward, type Weights, argMax, OUTPUTS } from "./net";

export class NetBrain implements Brain {
    public readonly weights: Weights
    protected version: 1 | 2
    constructor(weights: Weights) {
        this.version = versionFor(weights[0].length - 1)
        this.weights = weights;
        if (weights.length !== OUTPUTS) throw new Error(`NetBrain: expected ${OUTPUTS} rows, got ${weights.length}`)
    }

    decide(obs: Observation): Action {
        const forwardResult = forward(this.weights, encode(obs, this.version))
        const index = argMax(forwardResult)
        const move = DIRECTIONS[index]
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        return { move, attack: target?.id }
    }

}
