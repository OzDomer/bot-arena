import { writeFileSync } from "node:fs"
import { fitness } from "./evo/fitness"
import { randomWeights } from "./evo/net"
import { updateWeights, type Sample } from "./evo/policy"
import { PolicyBrain, type Decision } from "./evo/PolicyBrain"
import { playMatch } from "./sim/playMatch"
import { PRESETS } from "./sim/presets"
import { makeRng, deriveSeed } from "./util/random"
import type { Entrant, Hit } from "./types"
import { heldout, trainingPool } from "./bots/lineups"
import { runTournament } from "./sim/tournament"
import { NetBrain } from "./evo/NetBrain"
import { ENCODING_VERSION, inputsFor } from "./evo/encode"

const updates = Number(process.argv[2] ?? 200)
const batch = Number(process.argv[3] ?? 500)
const lr = Number(process.argv[4] ?? 0.01)
const seed = Number(process.argv[5] ?? 1790266907455)
const mode = process.argv[6] ?? 'fitness'
if (mode !== 'fitness' && mode !== 'dense') throw new Error(`unknown mode: ${mode}`)

let weights = randomWeights(makeRng(deriveSeed(seed, 'init')), inputsFor(ENCODING_VERSION))

const buffer: Decision[] = []
const samples: Sample[] = []
const turnHits: Hit[][] = []


const trainlineup: Entrant[] = [...trainingPool, { name: 'net', make: rng => new PolicyBrain(weights, rng, buffer) }]


for (let u = 0; u < updates; u++) {
    samples.length = 0
    let sumR = 0

    for (let b = 0; b < batch; b++) {
        buffer.length = 0
        turnHits.length = 0
        const { final, perMatch, seating } = playMatch(trainlineup, deriveSeed(seed, 'train', u * batch + b), PRESETS.bigmap, (_, hits) => turnHits.push(hits))
        const id = seating.indexOf(trainlineup.length - 1) + 1
        const R = fitness(perMatch[id])
        sumR += R

        const r: number[] = turnHits.map(hits => {
            let dealt = 0, taken = 0
            for (const h of hits) {
                if (h.attacker === id) dealt += h.amount
                if (h.target === id) taken += h.amount

            }
            return dealt - taken
        })
        const alive = final.ships.filter(s => s.hp > 0)
        if (alive.length === 1 && alive[0].id === id) r[r.length - 1] += 100
        const G: number[] = new Array(r.length)
        let acc = 0
        for (let t = r.length - 1; t >= 0; t--) { acc += r[t]; G[t] = acc }

        if (mode === 'fitness') buffer.forEach(d => samples.push({ ...d, G: R }))
        else buffer.forEach((d, t) => samples.push({ ...d, G: G[t] }))
    }
    const prev = weights
    weights = updateWeights(weights, samples, lr)
    let maxDelta = 0
    for (let j = 0; weights.length; j++)
        for (let i = 0; weights[0].length; i++)
            maxDelta = Math.max(maxDelta, Math.abs(weights[j][i] - prev[j][i]))
    console.log(u, (sumR / batch).toFixed(2), maxDelta.toFixed(5))
}
writeFileSync(`runs/reinforce-v${ENCODING_VERSION}-${mode}-${updates}u-seed${seed === 1790266907455 ? 1 : seed}.json`, JSON.stringify(weights))
const CHECK_SEED = 1790266907455
const checkLineup: Entrant[] = [...heldout, { name: 'trained', make: () => new NetBrain(weights) }]
const { tally, totals } = runTournament(checkLineup, 10000, CHECK_SEED, PRESETS.bigmap)

console.table(tally)
console.table(totals.map((t, i) => ({ name: checkLineup[i].name, ...t })))
