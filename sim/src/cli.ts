import { showcase } from './bots/lineups'
import { PRESETS, type PresetName } from './sim/presets'
import { runTournament } from './sim/tournament'

const matches = Number(process.argv[2] ?? 1000)   // default match count
const preset = process.argv[3] ?? 'default'
const seed = Number(process.argv[4] ?? 1790266907455)      // picked a fixed one

function isPresetName(s: string): s is PresetName {
    return s in PRESETS
}

if (!isPresetName(preset)) throw new Error(`unknown preset: ${preset}`)

const rules = PRESETS[preset]   // preset is now PresetName — no cast

console.log(`matches: ${matches}  seed: ${seed} preset: ${preset}`)
const { tally, totals } = runTournament(showcase, matches, seed, rules)
console.table(tally)
console.table(totals.map((t, i) => ({name: showcase[i].name, ...t})))