import { randomInt } from 'node:crypto'
import { ENTRANT_NAMES } from '@arena/sim/bots'
import { canonicalNames } from './canonicalNames.ts'

export function drawLineup(seats: number, random: (max: number) => number = randomInt, pool: readonly string[] = ENTRANT_NAMES,): string[] {
    if (seats > pool.length) throw new Error(`can't seat ${seats} from ${pool.length} entrants`)
    const lineup = [...pool]
    for (let i = lineup.length - 1; i > 0; i--) {
        const j = random(i + 1);
            [lineup[i], lineup[j]] = [lineup[j], lineup[i]]
    }
    return canonicalNames(lineup.slice(0, seats))
}