import type { Action, Ship, World } from "../types";
import { manhattan } from "./geometry";

export function step(world: World, actions: Record<Ship['id'], Action>): World {
    // --- phase 1: attacks (resolved on current positions, simultaneous) ---
    const damage: Record<Ship['id'], number> = {};

    for (const attacker of world.ships) {
        if (attacker.hp <= 0) continue
        const action = actions[attacker.id]
        if (action?.attack === undefined) continue
        const target = world.ships.find(ship => ship.id === action.attack);
        if (!target || target.hp <= 0 || manhattan(attacker.position, target.position) > attacker.attackRange) continue;
        damage[target.id] = (damage[target.id] ?? 0) + attacker.attackDamage
    }

    const afterAttacks: Ship[] = world.ships.map(ship => ({
        ...ship,
        hp: Math.max(0, ship.hp - (damage[ship.id] ?? 0)),
        /* ship.hp minus whatever's in damage for it, floored at 0 */
    }));

    // --- phase 2: moves --- (later)
    // --- phase 3: turn ---  (later)

    return { ...world, ships: afterAttacks, turn: world.turn + 1 };
}