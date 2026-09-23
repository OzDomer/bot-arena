import { DELTAS, type Action, type Facing, type Position, type Ship, type World } from "../types";
import { clamp, chebyshev, key } from "./geometry";

export function step(world: World, actions: Record<Ship['id'], Action>): World {
    // --- phase 1: attacks (resolved on current positions, simultaneous) ---
    const damage: Record<Ship['id'], number> = {};

    for (const attacker of world.ships) {
        if (attacker.hp <= 0) continue
        const action = actions[attacker.id]
        if (action?.attack === undefined) continue
        const dest = world.ships.find(ship => ship.id === action.attack);
        if (!dest || dest.hp <= 0 || chebyshev(attacker.position, dest.position) > attacker.attackRange) continue;
        damage[dest.id] = (damage[dest.id] ?? 0) + attacker.attackDamage
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

    const moved = new Map<Ship['id'], { position: Position; facing: Facing }>()    // id → final position + facing direction for ships that actually moved

    for (const ship of afterAttacks) {
        const move = actions[ship.id]?.move ?? 'STAY'
        if (ship.hp <= 0 || move === 'STAY') continue
        const { dx, dy } = DELTAS[move];
        const dest = {
            x: clamp(ship.position.x + dx, 0, world.width - 1),
            y: clamp(ship.position.y + dy, 0, world.height - 1)
        }
        if (occupied.has(key(dest))) {
            moved.set(ship.id, { position: ship.position, facing: move })   // bounce: turned, didn't move
            occupied.add(key(ship.position))
            continue
        }
        occupied.add(key(dest))
        moved.set(ship.id, { position: dest, facing: move });            // success: moved and turned
    }
    const afterMoves = afterAttacks.map(ship => {
        const m = moved.get(ship.id);
        return m ? { ...ship, ...m } : ship;
    })

    return { ...world, ships: afterMoves, turn: world.turn + 1 }
}
