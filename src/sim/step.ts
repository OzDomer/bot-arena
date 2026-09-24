import { DELTAS, type Action, type Position, type Ship, type World } from "../types";
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

    // --- phase 2: moves (iterate until no new bounces) ---
    const dest = new Map<Ship['id'], Position>()      // where each mover wants to go
    const origin = new Map<Ship['id'], Position>()    // where each ship starts
    const blocked = new Set<Ship['id']>()             // ships that will not move this tick

    for (const ship of afterAttacks) {
        origin.set(ship.id, ship.position)
        const move = actions[ship.id]?.move ?? 'STAY'
        if (ship.hp <= 0 || move === 'STAY') { blocked.add(ship.id); continue }
        const { dx, dy } = DELTAS[move]
        const d = { x: clamp(ship.position.x + dx, 0, world.rules.width - 1), y: clamp(ship.position.y + dy, 0, world.rules.height - 1) }                  // same clamp as before
        if (key(d) === key(ship.position)) { blocked.add(ship.id); continue }   // clamped onto own tile = stay
        dest.set(ship.id, d)
    }

    // swaps: two movers heading into each other's tiles both bounce
    for (const [a, da] of dest) for (const [b, db] of dest) {
        if (a < b && key(da) === key(origin.get(b)!) && key(db) === key(origin.get(a)!)) { blocked.add(a); blocked.add(b) }
    }
    // cascade: a bounced ship re-occupies its origin, which may block someone who already claimed it
    let changed = true
    while (changed) {
        changed = false
        const occupied = new Set<string>()
        for (const ship of afterAttacks) if (blocked.has(ship.id)) occupied.add(key(ship.position))
        for (const ship of afterAttacks) {
            if (blocked.has(ship.id)) continue
            const d = dest.get(ship.id)!
            if (occupied.has(key(d))) { blocked.add(ship.id); changed = true }
            else occupied.add(key(d))
        }
    }


    const afterMoves = afterAttacks.map(ship => {
        const move = actions[ship.id]?.move ?? 'STAY'
        if (ship.hp <= 0 || move === 'STAY') return ship
        const position = blocked.has(ship.id) ? ship.position : dest.get(ship.id)!
        return { ...ship, position, facing: move }                    // turned either way
    })
    // --- phase 3: storm (after moves, on final positions) ---
    const storm = stormAt(world.turn, world.rules)

    const afterStorm = afterMoves.map(ship => {
        if (ship.hp <= 0 || isSafe(ship.position, world.storm.center, storm.radius)) return ship          // wrecks and safe ships untouched
        return { ...ship, hp: Math.max(0, ship.hp - storm.damage) }
    })

    return { ...world, ships: afterStorm, turn: world.turn + 1 }

}

