import type { Entrant } from "../types.ts"
import { BOTS } from "./bots.ts"
import evo from '../../brains/linear-500m-seed2.json' with {type: 'json'}
import evoVulture from '../../brains/linear-500m-seed1.json' with {type: 'json'}
import reinforceV1Fit from '../../brains/reinforce-fitness-5000u-seed1.json' with {type: 'json'}
import reinforceV1Dense from '../../brains/reinforce-dense-5000u-seed1.json' with {type: 'json'}
import reinforceV2 from '../../brains/reinforce-v2-dense-5000u-seed1.json' with {type: 'json'}


export const ENTRANTS = {
    random: rng => new BOTS.RandomBot(rng),
    cowardV1: rng => new BOTS.CowardV1(rng),
    chaserV1: rng => new BOTS.ChaserV1(rng),
    chaserV2: rng => new BOTS.ChaserV2(rng),
    camperV1: () => new BOTS.CamperV1(),
    camperV2: () => new BOTS.CamperV2(),
    evo: () => new BOTS.NetBrain(evo),
    evoVulture: () => new BOTS.NetBrain(evoVulture),
    reinforceV1Fit: () => new BOTS.NetBrain(reinforceV1Fit),
    reinforceV1Dense: () => new BOTS.NetBrain(reinforceV1Dense),
    reinforceV2: () => new BOTS.NetBrain(reinforceV2),

} satisfies Record<string, Entrant['make']>

export type EntrantName = keyof typeof ENTRANTS

export function isEntrantName(name: string): name is EntrantName {
    return Object.hasOwn(ENTRANTS, name)
}


export function entrant(name: EntrantName): Entrant {
    return { name, make: ENTRANTS[name] }
}