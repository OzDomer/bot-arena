import { evolve } from "./evo/evolve"

const generation = process.argv[2] ?? 50
const seed = Number(process.argv[3] ?? 1790266907455)      // picked a fixed one

const runEvolve = evolve(Number(generation), seed)

console.log(runEvolve.score, runEvolve.born)