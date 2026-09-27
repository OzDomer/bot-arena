import type { Rng } from "../util/random"

export type Weights = number[][]   // OUTPUTS rows × (INPUTS + 1): INPUTS weights, then bias

export const OUTPUTS = 9


export function forward(weights: Weights, inputs: number[]): number[] {
    const out: number[] = []
    const n = weights[0].length - 1      
    for (const row of weights) {
        let sum = row[n]
        for (let i = 0; i < n; i++) {
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

export function randomWeights(rng: Rng, inputs: number): Weights {
    return Array.from({ length: OUTPUTS }, () => Array.from({ length: inputs + 1 }, () => rng() * 2 - 1))
}

export function mutate(weights: Weights, rng: Rng, step: number): Weights {
    const cols = weights[0].length
    return Array.from({ length: OUTPUTS }, (_, row) => Array.from({ length: cols }, (_, col) => weights[row][col] + (rng() * 2 - 1) * step))
}