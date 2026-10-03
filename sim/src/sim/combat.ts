import type { Action, Hit, Ship, World } from "../types";
import { attackArc, chebyshev } from "./geometry";

export function resolveAttacks(world: World, actions: Record<Ship['id'], Action>): Hit[] {
    const hits: Hit[] = []

    for (const attacker of world.ships) {
        if (attacker.hp <= 0) continue
        const action = actions[attacker.id]
        if (action?.attack === undefined) continue
        const target = world.ships.find(ship => ship.id === action.attack)
        if (!target || target.hp <= 0 || chebyshev(attacker.position, target.position) > attacker.attackRange) continue
        const mult = world.rules.arcMult[attackArc(target, attacker.position)];
        hits.push({ attacker: attacker.id, target: target.id, amount: attacker.attackDamage * mult })
    }
    return hits
}