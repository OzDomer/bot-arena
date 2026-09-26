import { PRESETS } from "../sim/presets";
import { runTournament } from "../sim/tournament";
import type { Entrant } from "../types";
import { fitness } from "./fitness";
import type { Weights } from "./net";
import { NetBrain } from "./NetBrain";
import { trainingPool } from "../bots/lineups";



export function evaluate(weights: Weights, seed: number, matches: number = 500): number {
    const lineup: Entrant[] =
        [...trainingPool, { name: 'net', make: () => new NetBrain(weights) }]
    const { totals } = runTournament(lineup, matches, seed, PRESETS.bigmap)
    return fitness(totals[4])
}