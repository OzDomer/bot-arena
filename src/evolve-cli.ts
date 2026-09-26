import { writeFileSync } from "fs"
import { evolve } from "./evo/evolve"

const step = Number(process.argv[4] ?? 0.1)
const generation = process.argv[2] ?? 50
const seed = Number(process.argv[3] ?? 1790266907455)      // picked a fixed one

const best = evolve(Number(generation), seed, step)

console.log(best.score, best.born)

writeFileSync('best.json', JSON.stringify(best.weights))