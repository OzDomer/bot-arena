import { chebyshev } from "../sim/geometry";
import { type Brain, type Observation, type Action, DIRECTIONS } from "../types";
import type { Rng } from "../util/random";
import { encode } from "./encode";
import { INPUTS, OUTPUTS, type Weights, forward } from "./net";
import { sample, softmax } from "./policy";

export type Decision = { x: number[]; a: number; probs: number[] }

export class PolicyBrain implements Brain {
    protected weights: Weights
    protected rng: Rng
    protected buffer: Decision[]
    constructor(weights: Weights, rng: Rng, buffer: Decision[]) {
        this.weights = weights
        this.rng = rng
        this.buffer = buffer
        if (weights.length !== OUTPUTS || weights.some(r => r.length !== INPUTS + 1))
            throw new Error(`PolicyBrain: expected ${OUTPUTS}x${INPUTS + 1} weights, got ${weights.length}x${weights[0]?.length}`)
    }

    decide(obs: Observation): Action {
        const x = encode(obs)
        const probs = softmax(forward(this.weights, x))
        const a = sample(probs, this.rng)
        this.buffer.push({ x, a, probs })
        const move = DIRECTIONS[a]
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        return { move, attack: target?.id }
    }

}
