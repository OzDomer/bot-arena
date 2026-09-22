import { DELTAS, type Action, type Ship, type World } from "../types";
import { clamp, chebyshev } from "./geometry";

export function step(world: World, actions: Record<Ship['id'], Action>): World {
    // --- phase 1: attacks (resolved on current positions, simultaneous) ---
    const damage: Record<Ship['id'], number> = {};

    for (const attacker of world.ships) {
        if (attacker.hp <= 0) continue
        const action = actions[attacker.id]
        if (action?.attack === undefined) continue
        const target = world.ships.find(ship => ship.id === action.attack);
        if (!target || target.hp <= 0 || chebyshev(attacker.position, target.position) > attacker.attackRange) continue;
        damage[target.id] = (damage[target.id] ?? 0) + attacker.attackDamage
    }

    const afterAttacks: Ship[] = world.ships.map(ship => ({
        ...ship,
        hp: Math.max(0, ship.hp - (damage[ship.id] ?? 0)),
    }));
    const afterMoves: Ship[] = afterAttacks.map(ship => {
        if (ship.hp <= 0) return ship;
        const { dx, dy } = DELTAS[actions[ship.id]?.move ?? 'STAY'];
        const x = clamp(ship.position.x + dx, 0, world.width - 1)
        const y = clamp(ship.position.y + dy, 0, world.height - 1)
        return { ...ship, position: { x, y } };
    });
    return { ...world, ships: afterMoves, turn: world.turn + 1 };
}