import type { PresetName } from "@arena/sim";
import { isPresetName } from "@arena/sim";

export type MatchParams = { seed: number; preset: PresetName }

export function parseMatchParams(search: string): MatchParams | null {
    const params = new URLSearchParams(search)
    const seed = params.get('seed')
    const preset = params.get('preset')
    // if (seed === null || !/^\d+$/.test(seed)) return null
    const seedNum = Number(seed)
    if (seedNum > 4294967295) return null
    if (preset === null) return null
    if (!isPresetName(preset)) return null

    return { seed: seedNum, preset }
}
