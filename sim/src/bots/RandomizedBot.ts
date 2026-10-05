import type { Action, Brain, Observation } from "../types.ts";
import type { Rng } from "../util/random.ts";

export abstract class RandomizedBot implements Brain {
    protected rng: Rng;

    constructor(rng: Rng) {
        this.rng = rng;
    }

    abstract decide(obs: Observation): Action;
}