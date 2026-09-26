import { NetBrain } from "../evo/NetBrain"
import type { Entrant } from "../types"
import { CamperV1 } from "./CamperV1"
import { CamperV2 } from "./CamperV2"
import { ChaserV1 } from "./ChaserV1"
import { ChaserV2 } from "./ChaserV2"
import { CowardV1 } from "./CowardV1"
import { RandomBot } from "./RandomBot"
import seedDefault from '../../brains/linear-500m-defaultseed.json'
import seed2 from '../../brains/linear-500m-seed2.json'


export const BOTS = { RandomBot, ChaserV1, CowardV1, ChaserV2, CamperV1, CamperV2, NetBrain }


export const entrants: Entrant[] =
    [
        { name: 'defaultseedevo', make: () => new NetBrain(seedDefault) },
        { name: 'seed2evo', make: () => new NetBrain(seed2) },
        { name: 'defaultseedevo', make: () => new NetBrain(seedDefault) },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'coward', make: rng => new BOTS.CowardV1(rng) }]
