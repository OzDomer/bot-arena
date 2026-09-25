import { entrants } from './bots'
import { PRESETS, type PresetName } from './sim/presets'
import { runTournament } from './sim/tournament'

const matches = Number(process.argv[2] ?? 1000)   // default match count
const seed = Number(process.argv[3] ?? 1790266907455)      // picked a fixed one
const preset = process.argv[4] ?? 'default'

function isPresetName(s: string): s is PresetName {
    return s in PRESETS
}

if (!isPresetName(preset)) throw new Error(`unknown preset: ${preset}`)

const rules = PRESETS[preset]   // preset is now PresetName — no cast

console.log(`matches: ${matches}  seed: ${seed} preset: ${preset}`)
const { tally, totals } = runTournament(entrants, matches, seed, rules)
console.table(tally)
console.table(totals.map((t, i) => ({name: entrants[i].name, ...t})))