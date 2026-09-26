import { writeFileSync } from "node:fs"
import { fitness } from "./evo/fitness"
import { randomWeights } from "./evo/net"
import { updateWeights, type Sample } from "./evo/policy"
import { PolicyBrain, type Decision } from "./evo/PolicyBrain"
import { playMatch } from "./sim/playMatch"
import { PRESETS } from "./sim/presets"
import { makeRng, deriveSeed } from "./util/random"
import type { Entrant } from "./types"
import { trainingPool } from "./bots/lineups"
import { runTournament } from "./sim/tournament"

const updates = Number(process.argv[2] ?? 200)
const batch = Number(process.argv[3] ?? 500)
const lr = Number(process.argv[4] ?? 0.01)
const seed = Number(process.argv[5] ?? 1790266907455)

let weights = randomWeights(makeRng(deriveSeed(seed, 'init')))

const buffer: Decision[] = []
const samples: Sample[] = []


const lineup: Entrant[] = [...trainingPool, { name: 'net', make: rng => new PolicyBrain(weights, rng, buffer) }]


for (let u = 0; u < updates; u++) {
    samples.length = 0
    let sumR = 0
    for (let b = 0; b < batch; b++) {
        buffer.length = 0
        const { perMatch, seating } = playMatch(lineup, deriveSeed(seed, 'train', u * batch + b), PRESETS.bigmap)
        const id = seating.indexOf(lineup.length - 1) + 1
        const R = fitness(perMatch[id])
        sumR += R
        for (const d of buffer) samples.push({ ...d, G: R })
    }
    weights = updateWeights(weights, samples, lr)
    console.log(u, sumR / batch)
}
writeFileSync('best-trained.json', JSON.stringify(weights))
const { tally, totals } = runTournament(lineup, 10000, seed, PRESETS.bigmap)

console.table(tally)
console.table(totals.map((t, i) => ({ name: lineup[i].name, ...t })))