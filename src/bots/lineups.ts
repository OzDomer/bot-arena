import { BOTS } from "./bots"
import type { Entrant } from "../types"
import seedDefault from '../../brains/linear-500m-defaultseed.json'
import seed2 from '../../brains/linear-500m-seed2.json'


export const showcase: Entrant[] =
    [
        { name: 'defaultseedevo', make: () => new BOTS.NetBrain(seedDefault) },
        { name: 'seed2evo', make: () => new BOTS.NetBrain(seed2) },
        { name: 'camperV1', make: () => new BOTS.CamperV1() },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'chaserV1', make: rng => new BOTS.ChaserV1(rng) },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'random', make: rng => new BOTS.RandomBot(rng) },
        { name: 'coward', make: rng => new BOTS.CowardV1(rng) }]





export const heldout: Entrant[] =
    [
        { name: 'defaultseedevo', make: () => new BOTS.NetBrain(seedDefault) },
        { name: 'seed2evo', make: () => new BOTS.NetBrain(seed2) },
        { name: 'defaultseedevo', make: () => new BOTS.NetBrain(seedDefault) },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'coward', make: rng => new BOTS.CowardV1(rng) }]

