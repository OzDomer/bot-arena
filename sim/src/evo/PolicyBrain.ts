import { chebyshev } from "../sim/geometry";
import { type Brain, type Observation, type Action, DIRECTIONS, type Weights } from "../types";
import type { Rng } from "../util/random";
import { encode, versionFor } from "./encode";
import { OUTPUTS, forward } from "./net";
import { sample, softmax } from "./policy";

export type Decision = { x: number[]; a: number; probs: number[] }

export class PolicyBrain implements Brain {
    protected weights: Weights
    protected rng: Rng
    protected buffer: Decision[]
    protected version: 1 | 2
    constructor(weights: Weights, rng: Rng, buffer: Decision[]) {
        this.version = versionFor(weights[0].length - 1)
        this.weights = weights
        this.rng = rng
        this.buffer = buffer
        if (weights.length !== OUTPUTS) throw new Error(`PolicyBrain: expected ${OUTPUTS} rows, got ${weights.length}`)
    }

    decide(obs: Observation): Action {
        const x = encode(obs, this.version)
        const probs = softmax(forward(this.weights, x))
        const a = sample(probs, this.rng)
        this.buffer.push({ x, a, probs })
        const move = DIRECTIONS[a]
        const target = obs.visibleShips.find(ship => ship.hp > 0 && chebyshev(obs.self.position, ship.position) <= obs.self.attackRange)
        return { move, attack: target?.id }
    }

}
