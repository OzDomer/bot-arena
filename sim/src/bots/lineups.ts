import type { Entrant } from "../types"
import { entrant } from "./entrants"



export const showcase: Entrant[] =
    [
        entrant('evoVulture'),
        entrant('evo'),
        entrant('camperV1'),
        entrant('camperV2'),
        entrant('chaserV1'),
        entrant('chaserV2'),
        entrant('random'),
        entrant('cowardV1'),
        entrant('reinforceV2')
    ]


export const heldout: Entrant[] =
    [
        entrant('evoVulture'),
        entrant('evo'),
        entrant('evoVulture'),
        entrant('camperV2'),
        entrant('camperV2'),
        entrant('chaserV2'),
        entrant('chaserV2'),
        entrant('cowardV1')
    ]


export const trainingPool: Entrant[] = [
    entrant('chaserV2'),
    entrant('evo'),
    entrant('camperV2'),
    entrant('cowardV1')
]