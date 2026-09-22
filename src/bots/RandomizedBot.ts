import type { Action, Brain, Observation } from "../types";
import type { Rng } from "../util/random";

export abstract class RandomizedBot implements Brain {
    protected rng: Rng;

    constructor(rng: Rng) {
        this.rng = rng;
    }

    abstract decide(obs: Observation): Action;
}