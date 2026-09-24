import type { Entrant } from "../types";
import { CamperV1 } from "./CamperV1";
import { ChaserV1 } from "./ChaserV1";
import { ChaserV2 } from "./ChaserV2";
import { CowardV1 } from "./CowardV1";
import { RandomBot } from "./RandomBot";

export const BOTS = { random: RandomBot, chaserV1: ChaserV1, coward: CowardV1, chaserV2: ChaserV2, camperV1: CamperV1 }

export const entrants: Entrant[] =
    [
        { name: 'chaserV2', make: rng => new BOTS.chaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.chaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.chaserV2(rng) },
        { name: 'chaserV1', make: rng => new BOTS.chaserV1(rng) },
        { name: 'chaserV1', make: rng => new BOTS.chaserV1(rng) },
        { name: 'chaserV1', make: rng => new BOTS.chaserV1(rng) },
        { name: 'camperV1', make: () => new BOTS.camperV1() },
        { name: 'coward', make: rng => new BOTS.coward(rng) }
    ]
