import type { Rng } from "../util/random"

export function softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits)
    const exps = logits.map(logit => Math.exp(logit - maxLogit))
    const sumExps = exps.reduce((sum, exp) => sum + exp, 0)
    return exps.map(exp => exp / sumExps)
}

export function sample(probs: number[], rng: Rng): number {
    const r = rng()
    let sum = 0
    for(let i = 0; i < probs.length; i++ ){
        sum += probs[i]
        if(sum > r) return i
    }
    return probs.length - 1
}