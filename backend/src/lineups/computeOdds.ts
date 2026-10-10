import { PRESETS, runTournament, type PresetName } from "@arena/sim";
import { entrant, isEntrantName } from "@arena/sim/bots";
import type { Odds } from "../db/schema.ts";

const ODDS_SEED = 67

export function computeOdds(names: readonly string[], preset: PresetName, matches = 2000): Odds {
    const entrants = names.map((name) => {
        if (!isEntrantName(name)) throw new Error(`unknown entrant: ${name}`)
        return entrant(name)
    })
    const rules = PRESETS[preset]
    const { tally } = runTournament(entrants, matches, ODDS_SEED, rules)

    const wins = Object.fromEntries(
        names.map((name) => [name, (tally[name] ?? 0) / matches])
    )
    const draw = (tally['draw'] ?? 0) / matches
    const timeout = (tally['timeout'] ?? 0) / matches

    return { wins, draw, timeout }
}