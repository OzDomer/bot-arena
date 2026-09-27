import { BOTS } from "./bots"
import type { Entrant } from "../types"
import v1seed1 from '../../brains/linear-500m-seed1.json'
import v1seed2 from '../../brains/linear-500m-seed2.json'
import v2reinforceseed1 from '../../brains/reinforce-v2-dense-5000u-seed1.json'



export const showcase: Entrant[] =
    [
        { name: 'defaultseedevo', make: () => new BOTS.NetBrain(v1seed1) },
        { name: 'seed2evo', make: () => new BOTS.NetBrain(v1seed2) },
        { name: 'camperV1', make: () => new BOTS.CamperV1() },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'chaserV1', make: rng => new BOTS.ChaserV1(rng) },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'random', make: rng => new BOTS.RandomBot(rng) },
        { name: 'coward', make: rng => new BOTS.CowardV1(rng) },
        { name: 'reinforceV2', make: () => new BOTS.NetBrain(v2reinforceseed1) }
    ]


export const heldout: Entrant[] =
    [
        { name: 'defaultseedevo', make: () => new BOTS.NetBrain(v1seed1) },
        { name: 'seed2evo', make: () => new BOTS.NetBrain(v1seed2) },
        { name: 'defaultseedevo', make: () => new BOTS.NetBrain(v1seed1) },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'camperV2', make: () => new BOTS.CamperV2() },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
        { name: 'coward', make: rng => new BOTS.CowardV1(rng) }]


export const trainingPool: Entrant[] = [
    { name: 'chaserV2', make: rng => new BOTS.ChaserV2(rng) },
    { name: 'seed2', make: () => new BOTS.NetBrain(v1seed2) },
    { name: 'camperV2', make: () => new BOTS.CamperV2() },
    { name: 'coward', make: rng => new BOTS.CowardV1(rng) },
]