import type { Rng } from "../util/random"

export type Weights = number[][]   // OUTPUTS rows × (INPUTS + 1): INPUTS weights, then bias

export const INPUTS = 18
export const OUTPUTS = 9


export function forward(weights: Weights, inputs: number[]): number[] {
    const out: number[] = []
    for (const row of weights) {
        let sum = row[INPUTS]
        for (let i = 0; i < INPUTS; i++) {
            sum += row[i] * inputs[i]
        }
        out.push(sum)
    }
    return out
}

export function argMax(values: number[]): number {
    let best = 0
    for (let i = 1; i < values.length; i++) {
        if (values[i] > values[best]) best = i
    }
    return best
}

export function randomWeights(rng: Rng): Weights {
    return Array.from({ length: OUTPUTS }, () => Array.from({ length: INPUTS + 1 }, () => rng() * 2 - 1))
}

export function mutate(weights: Weights, rng: Rng, step: number): Weights {
    return Array.from({ length: OUTPUTS }, (_, row) => Array.from({ length: INPUTS + 1 }, (_, col) => weights[row][col] + (rng() * 2 - 1) * step))
}