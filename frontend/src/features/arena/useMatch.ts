import type { PresetName } from "@arena/sim"
import { showcase } from "@arena/sim/bots"
import { useMemo } from "react"
import { buildMatch } from "./buildMatch"

export type Match = ReturnType<typeof useMatch>

export function useMatch(seed: number, preset: PresetName) {
    return useMemo(() => buildMatch(showcase, seed, preset), [seed, preset])
}
