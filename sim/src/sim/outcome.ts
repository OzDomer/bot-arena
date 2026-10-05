import type { Ship, World } from "../types.ts";

export type Outcome =
    | { kind: 'win'; winner: Ship['id'] }
    | { kind: 'draw' }
    | { kind: 'timeout' }

export function outcome(final: World): Outcome {
    const alive = final.ships.filter(s => s.hp > 0).map(s => s.id)
    if (alive.length === 1) return { kind: 'win', winner: alive[0] }
    if (alive.length === 0) return { kind: 'draw' }
    return { kind: 'timeout' }
}