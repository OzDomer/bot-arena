import type { Rng } from "../util/random"
import { INPUTS, OUTPUTS, type Weights } from "./net"

export function softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits)
    const exps = logits.map(logit => Math.exp(logit - maxLogit))
    const sumExps = exps.reduce((sum, exp) => sum + exp, 0)
    return exps.map(exp => exp / sumExps)
}

export function sample(probs: number[], rng: Rng): number {
    const r = rng()
    let sum = 0
    for (let i = 0; i < probs.length; i++) {
        sum += probs[i]
        if (sum > r) return i
    }
    return probs.length - 1
}


export function gradLogPi(x: number[], a: number, probs: number[]): Weights {
    const grad: Weights = []

    for (let j = 0; j < OUTPUTS; j++) {
        grad[j] = []                        // one row per direction
        const d = (j === a ? 1 : 0) - probs[j]       // ← probs used here, once
        for (let i = 0; i < INPUTS; i++) {                     // 18 inputs
            grad[j][i] = d * x[i]
        }
        grad[j][INPUTS] = d
        // bias column
    }
    return grad
}

export type Sample = { x: number[]; a: number; probs: number[]; G: number }

export function updateWeights(weights: Weights, samples: Sample[], lr: number): Weights {
    const meanG = samples.reduce((a, b) => a + b.G, 0) / samples.length
    const acc = Array.from({ length: 9 }, () => Array(19).fill(0))
    for (const s of samples) {
        const adv = s.G - meanG
        const g = gradLogPi(s.x, s.a, s.probs)
        for (let j = 0; j < 9; j++)
            for (let i = 0; i < 19; i++)
                acc[j][i] += adv * g[j][i]
    }
    return Array.from({ length: 9 }, (_, j) =>
        Array.from({ length: 19 }, (_, i) => weights[j][i] + lr * acc[j][i] / samples.length))
}