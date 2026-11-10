import { type Entrant, type Frame, type Outcome, type PresetName, type Rules, type Ship, type Weights, outcome, playMatch, PRESETS } from "@arena/sim"
import { NetBrain } from "@arena/sim/bots"

export type Match = {
    history: Frame[]
    names: Record<Ship['id'], string>
    intent: Record<Ship['id'], Weights>
    rules: Rules
    result: Outcome
}

// Runs the whole match up front. The entrant order matters: seating is
// shuffled from the seed, so the same entrants in another order give a
// different match.
export function buildMatch(entrants: Entrant[], seed: number, preset: PresetName): Match {
    const rules = PRESETS[preset]

    const turns: Frame[] = []
    const { initial, seating, brains, final } = playMatch(entrants, seed, rules, (world, hits) => turns.push({ world, hits }))
    const history: Frame[] = [{ world: initial, hits: [] }, ...turns]

    const names: Record<Ship['id'], string> = {}
    seating.forEach((entrantIndex, k) => names[k + 1] = entrants[entrantIndex].name)

    const intent: Record<Ship['id'], Weights> = {}
    for (const [id, brain] of Object.entries(brains))
        if (brain instanceof NetBrain) intent[Number(id)] = brain.weights

    return { history, names, intent, rules, result: outcome(final) }
}
