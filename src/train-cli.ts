import { writeFileSync } from "node:fs"
import { fitness } from "./evo/fitness"
import { randomWeights } from "./evo/net"
import { updateWeights, type Sample } from "./evo/policy"
import { PolicyBrain, type Decision } from "./evo/PolicyBrain"
import { playMatch } from "./sim/playMatch"
import { PRESETS } from "./sim/presets"
import { makeRng, deriveSeed } from "./util/random"
import type { Entrant } from "./types"
import { heldout, trainingPool } from "./bots/lineups"
import { runTournament } from "./sim/tournament"
import { NetBrain } from "./evo/NetBrain"

const updates = Number(process.argv[2] ?? 200)
const batch = Number(process.argv[3] ?? 500)
const lr = Number(process.argv[4] ?? 0.01)
const seed = Number(process.argv[5] ?? 1790266907455)

let weights = randomWeights(makeRng(deriveSeed(seed, 'init')))

const buffer: Decision[] = []
const samples: Sample[] = []


const trainlineup: Entrant[] = [...trainingPool, { name: 'net', make: rng => new PolicyBrain(weights, rng, buffer) }]


for (let u = 0; u < updates; u++) {
    samples.length = 0
    let sumR = 0
    for (let b = 0; b < batch; b++) {
        buffer.length = 0
        const { perMatch, seating } = playMatch(trainlineup, deriveSeed(seed, 'train', u * batch + b), PRESETS.bigmap)
        const id = seating.indexOf(trainlineup.length - 1) + 1
        const R = fitness(perMatch[id])
        sumR += R
        for (const d of buffer) samples.push({ ...d, G: R })
    }
    const prev = weights
    weights = updateWeights(weights, samples, lr)
    let maxDelta = 0
    for (let j = 0; j < 9; j++)
        for (let i = 0; i < 19; i++)
            maxDelta = Math.max(maxDelta, Math.abs(weights[j][i] - prev[j][i]))
    console.log(u, (sumR / batch).toFixed(2), maxDelta.toFixed(5))
}
writeFileSync('best-trained.json', JSON.stringify(weights))
const CHECK_SEED = 1790266907455
const checkLineup: Entrant[] = [...heldout, { name: 'trained', make: () => new NetBrain(weights) }]
const { tally, totals } = runTournament(checkLineup, 10000, CHECK_SEED, PRESETS.bigmap)

console.table(tally)
console.table(totals.map((t, i) => ({ name: checkLineup[i].name, ...t })))
