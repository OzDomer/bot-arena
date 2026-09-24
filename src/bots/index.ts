import type { Entrant } from "../types";
import { ChaserFSM } from "./ChaserFSM";
import { CowardFSM } from "./CowardFSM";
import { RandomBot } from "./RandomBot";

export const BOTS = { random: RandomBot, chaser: ChaserFSM, coward: CowardFSM }

export const entrants: Entrant[] =
    [
        { name: 'coward', make: rng => new BOTS.coward(rng) },
        { name: 'chaser', make: rng => new BOTS.chaser(rng) },
        { name: 'coward', make: rng => new BOTS.coward(rng) },
        { name: 'chaser', make: rng => new BOTS.chaser(rng) },
        { name: 'chaser', make: rng => new BOTS.chaser(rng) },
        { name: 'coward', make: rng => new BOTS.coward(rng) },
        { name: 'coward', make: rng => new BOTS.coward(rng) }
    ]
