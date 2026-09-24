import { DELTAS, type Action, type Facing, type Position, type Ship, type World } from "../types";
import { resolveAttacks } from "./combat";
import { clamp, key } from "./geometry";
import { isSafe, stormAt } from "./storm";

export function step(world: World, actions: Record<Ship['id'], Action>): World {
    // --- phase 1: attacks (resolved on current positions, simultaneous) ---
    const hits = resolveAttacks(world, actions)          // list of { attacker, target, amount }

    const damage: Record<Ship['id'], number> = {}        // target id → total damage this tick
    for (const hit of hits) {
        damage[hit.target] = (damage[hit.target] ?? 0) + hit.amount   // add this hit to the target's running total
    }

    const afterAttacks: Ship[] = world.ships.map(ship => ({
        ...ship,
        hp: Math.max(0, ship.hp - (damage[ship.id] ?? 0)),           // untouched from before
    }))

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
            x: clamp(ship.position.x + dx, 0, world.rules.width - 1),
            y: clamp(ship.position.y + dy, 0, world.rules.height - 1)
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
    // --- phase 3: storm (after moves, on final positions) ---
    const storm = stormAt(world.turn, world.rules)

    const afterStorm = afterMoves.map(ship => {
        if (ship.hp <= 0 || isSafe(ship.position, world.storm.center, storm.radius)) return ship          // wrecks and safe ships untouched
        return { ...ship, hp: Math.max(0, ship.hp - storm.damage) }
    })

    return { ...world, ships: afterStorm, turn: world.turn + 1 }

}
