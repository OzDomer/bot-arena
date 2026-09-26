import { writeFileSync } from "fs"
import { evolve } from "./evo/evolve"
import { runTournament } from "./sim/tournament"
import { showcase } from "./bots/lineups"
import { NetBrain } from "./evo/NetBrain"
import { PRESETS } from "./sim/presets"

const step = Number(process.argv[4] ?? 0.1)
const generation = process.argv[2] ?? 50
const seed = Number(process.argv[3] ?? 1790266907455)      // picked a fixed one
const CHECK_SEED = 1790266907455   // every 10k check in DECISIONS uses this; keep it fixed

const best = evolve(Number(generation), seed, step)

console.log(best.score, best.born)

writeFileSync('best.json', JSON.stringify(best.weights))

const lineup = [...showcase, { name: 'evolved', make: () => new NetBrain(best.weights) }]

const { tally, totals } = runTournament(lineup, 10000, CHECK_SEED, PRESETS.bigmap)


console.table(tally)
console.table(totals.map((t, i) => ({ name: lineup[i].name, ...t })))