import { DELTAS, type Action, type Position, type Ship, type World } from "../types";
import { clamp, chebyshev, key } from "./geometry";

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
    // --- phase 2: moves (two passes, wrecks and stayers claim first) ---
    const occupied = new Set<string>();

    for (const ship of afterAttacks) {
        const move = actions[ship.id]?.move ?? 'STAY'
        if (ship.hp <= 0 || move === 'STAY') occupied.add(key(ship.position))
    }

    const moved = new Map<Ship['id'], Position>();   // id → final position for ships that actually moved

    for (const ship of afterAttacks) {
        const move = actions[ship.id]?.move ?? 'STAY'
        if (ship.hp <= 0 || move === 'STAY') continue
        const { dx, dy } = DELTAS[move];
        const target = {
            x: clamp(ship.position.x + dx, 0, world.width - 1),
            y: clamp(ship.position.y + dy, 0, world.height - 1)
        };
        if (occupied.has(key(target))) { occupied.add(key(ship.position)); continue; }
        occupied.add(key(target));
        moved.set(ship.id, target);
    }

    const afterMoves: Ship[] = afterAttacks.map(ship => ({
        ...ship,
        position: moved.get(ship.id) ?? ship.position,
    }));
    return { ...world, ships: afterMoves, turn: world.turn + 1 };
}