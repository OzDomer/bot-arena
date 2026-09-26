import type { Rng } from "../util/random"
import type { Weights } from "./net"

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

    for (let j = 0; j < 9; j++) {
        grad[j] = []                        // one row per direction
        const d = (j === a ? 1 : 0) - probs[j]       // ← probs used here, once
        for (let i = 0; i < 18; i++) {                     // 18 inputs
            grad[j][i] = d * x[i]
        }
        grad[j][18] = d
        // bias column
    }
    return grad
}