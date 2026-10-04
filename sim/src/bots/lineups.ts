import { entrant } from "./entrants"



export const showcase = (
    [
        'evoVulture',
        'evo',
        'camperV1',
        'camperV2',
        'chaserV1',
        'chaserV2',
        'random',
        'cowardV1',
        'reinforceV2'
    ] as const).map(entrant)

export const heldout = (
    [
        'evoVulture',
        'evo',
        'evoVulture',
        'camperV2',
        'camperV2',
        'chaserV2',
        'chaserV2',
        'cowardV1'
    ] as const).map(entrant)


export const trainingPool = (
    [
        'chaserV2',
        'evo',
        'camperV2',
        'cowardV1'
    ] as const).map(entrant)

