import { BOTS } from "../bots";
import { PRESETS } from "../sim/presets";
import { runTournament } from "../sim/tournament";
import type { Entrant } from "../types";
import { fitness } from "./fitness";
import type { Weights } from "./net";
import { NetBrain } from "./NetBrain";



export function evaluate(weights: Weights): number {
    const lineup: Entrant[] =
        [
            { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
            { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
            { name: 'camperV2', make: () => new BOTS.CamperV2() },
            { name: 'coward', make: rng => new BOTS.CowardV1(rng) },
            { name: 'net', make: () => new NetBrain(weights) }
        ]
        // tournament seed is currently hardcoded 
    const { totals } = runTournament(lineup, 100, 1790266907455, PRESETS.bigmap)
    return fitness(totals[4])
}