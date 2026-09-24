import type { Entrant } from "../types";
import { ChaserFSM } from "./ChaserFSM";
import { ChaserV2 } from "./ChaserV2";
import { CowardFSM } from "./CowardFSM";
import { RandomBot } from "./RandomBot";

export const BOTS = { random: RandomBot, chaser: ChaserFSM, coward: CowardFSM, chaserV2: ChaserV2 }

export const entrants: Entrant[] =
    [
        { name: 'chaserV2', make: rng => new BOTS.chaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.chaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.chaserV2(rng) },
        { name: 'chaser', make: rng => new BOTS.chaser(rng) },
        { name: 'chaser', make: rng => new BOTS.chaser(rng) },
        { name: 'chaser', make: rng => new BOTS.chaser(rng) },
        { name: 'coward', make: rng => new BOTS.coward(rng) }
    ]
