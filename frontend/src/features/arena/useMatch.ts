import { type PresetName, PRESETS, type Frame, playMatch, type Ship, type Weights, outcome } from "@arena/sim"
import { NetBrain, showcase } from "@arena/sim/bots"
import { useMemo } from "react"

export type Match = ReturnType<typeof useMatch>

export function useMatch(seed: number, preset: PresetName) {
    return useMemo(() => {
        const rules = PRESETS[preset]

        const turns: Frame[] = []
        const { initial, seating, brains, final } = playMatch(showcase, seed, rules, (world, hits) => turns.push({ world, hits }))
        const history: Frame[] = [{ world: initial, hits: [] }, ...turns]

        const names: Record<Ship['id'], string> = {}
        seating.forEach((entrantIndex, k) => names[k + 1] = showcase[entrantIndex].name)

        const intent: Record<Ship['id'], Weights> = {}
        for (const [id, brain] of Object.entries(brains))
            if (brain instanceof NetBrain) intent[Number(id)] = brain.weights
        const result = outcome(final)
        return { history, names, intent, rules, result }
    }, [seed, preset])
}