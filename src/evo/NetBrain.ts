import { chebyshev } from "../sim/geometry";
import { DIRECTIONS, type Action, type Brain, type Observation } from "../types";
import { encode } from "./encode";
import { forward, type Weights, argMax } from "./net";

export class NetBrain implements Brain {
    protected weights: Weights
    constructor(weights: Weights) {
        this.weights = weights;
    }

    decide(obs: Observation): Action {
        const forwardResult = forward(this.weights, encode(obs))
        const index = argMax(forwardResult)
        const move = DIRECTIONS[index]
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        return {move, attack: target?.id}
    }

}
