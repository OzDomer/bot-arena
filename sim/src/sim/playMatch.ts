import { type Entrant, type Rules, DEFAULT_RULES, type World, type Ship, type Hit, type Brain } from "../types.ts";
import { deriveSeed, makeRng, shuffle } from "../util/random.ts";
import { runMatch } from "./match.ts";
import { makeMatch } from "./setup.ts";
import { type SeatStats, MatchStats } from "./stats.ts";

export function playMatch(entrants: Entrant[], matchSeed: number, rules: Rules = DEFAULT_RULES, onTurn?: (world: World, hits: Hit[]) => void): { final: World, perMatch: Record<Ship['id'], SeatStats>, seating: number[], brains: Record<Ship['id'], Brain>, initial: World } {
    const seating = shuffle(entrants.map((_, i) => i), makeRng(deriveSeed(matchSeed, 'seat')))
    const { world, brains } = makeMatch(seating.map(i => entrants[i]), matchSeed, rules)
    const ms = new MatchStats(world)
    const final = runMatch(world, brains, (w, hits) => { ms.onTurn(w, hits); onTurn?.(w, hits) })
    const perMatch = ms.finish(final)
    return { final, perMatch, seating, brains, initial: world }

}

