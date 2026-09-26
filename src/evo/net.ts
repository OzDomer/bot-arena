import type { Rng } from "../util/random"

export type Weights = number[][]   // 9 rows × 19: 18 input weights, then bias

export function forward(weights: Weights, inputs: number[]): number[] {
    const out: number[] = []
    for (const row of weights) {
        let sum = row[18]
        for (let i = 0; i < 18; i++) {
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
    return Array.from({ length: 9 }, () => Array.from({ length: 19 }, () => rng() * 2 - 1))
}

export function mutate(weights: Weights, rng: Rng, step: number): Weights {
    return Array.from({ length: 9 }, (_, row) => Array.from({ length: 19 }, (_, col) => weights[row][col] + (rng() * 2 - 1) * step))
}