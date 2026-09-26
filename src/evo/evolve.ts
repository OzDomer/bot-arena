import { makeRng } from "../util/random";
import { evaluate } from "./evaluate";
import { mutate, randomWeights, type Weights } from "./net";

type Candidate = {
    weights: Weights,
    score: number,
    born: number
}

export function evolve(generations: number, seed: number) {
    const rng = makeRng(seed)
    let population: Candidate[] = Array.from({ length: 50 }, () => ({ weights: randomWeights(rng), score: 0, born: 0 }))
    for (let gen = 0; gen < generations; gen++) {
        const scored = population.map(p => ({ ...p, score: evaluate(p.weights) }))
        const ranked = scored.sort((a, b) => b.score - a.score)
        console.log(gen, ranked[0].score, ranked[0].born)
        const survivors = ranked.slice(0, 10)
        const children = Array.from({ length: 40 }, (_, i) => ({ weights: mutate(survivors[i % 10].weights, rng, 0.1), score: 0, born: gen + 1 }))
        population = survivors.concat(children)
    }
    return population[0]
}