import { DEFAULT_RULES, type Rules } from "../types"


export const PRESETS = {
    default: DEFAULT_RULES,
    faststorm: { ...DEFAULT_RULES, storm: { ...DEFAULT_RULES.storm, startTurn: 5, shrinkEvery: 5 } },
    bigmapweakstorm: { ...DEFAULT_RULES, width: 20, height: 20}, // bigger map "weaker" storm 
    bigmapfaststartstorm: { ...DEFAULT_RULES, width: 20, height: 20, storm: {...DEFAULT_RULES.storm, startTurn: 5}},
    bigmap: { ...DEFAULT_RULES, width: 20, height: 20, storm: {...DEFAULT_RULES.storm, shrinkEvery: 5}} // "default" big map moving forawrd based on testing
} satisfies Record<string, Rules>

export type PresetName = keyof typeof PRESETS