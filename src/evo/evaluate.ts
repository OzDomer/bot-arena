import { readFileSync } from "node:fs";
import { BOTS } from "../bots";
import { PRESETS } from "../sim/presets";
import { runTournament } from "../sim/tournament";
import type { Entrant } from "../types";
import { fitness } from "./fitness";
import type { Weights } from "./net";
import { NetBrain } from "./NetBrain";


const seed2 = JSON.parse(readFileSync('brains/linear-500m-seed2.json', 'utf8'))

export function evaluate(weights: Weights, seed: number, matches: number = 500): number {
    const lineup: Entrant[] =
        [
            { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
            { name: 'seed2', make: () => new NetBrain(seed2) },
            { name: 'camperV2', make: () => new BOTS.CamperV2() },
            { name: 'coward', make: rng => new BOTS.CowardV1(rng) },
            { name: 'net', make: () => new NetBrain(weights) }
        ]
    const { totals } = runTournament(lineup, matches, seed, PRESETS.bigmap)
    return fitness(totals[4])
}