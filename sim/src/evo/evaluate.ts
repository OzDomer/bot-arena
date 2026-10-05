import { PRESETS } from "../sim/presets.ts";
import { runTournament } from "../sim/tournament.ts";
import type { Entrant, Weights } from "../types.ts";
import { fitness } from "./fitness.ts";
import { NetBrain } from "./NetBrain.ts";
import { trainingPool } from "../bots/lineups.ts";



export function evaluate(weights: Weights, seed: number, matches: number = 500): number {
    const lineup: Entrant[] =
        [...trainingPool, { name: 'net', make: () => new NetBrain(weights) }]
    const { totals } = runTournament(lineup, matches, seed, PRESETS.bigmap)
    return fitness(totals[4])
}