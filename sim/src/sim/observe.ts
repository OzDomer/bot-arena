import type { Observation, Ship, World } from "../types";
import { chebyshev } from "./geometry";
import { stormAt } from "./storm";

export function observe(world: World, ship: Ship): Observation {
    const map = { width: world.rules.width, height: world.rules.height, turn: world.turn }

    const visibleShips = world.ships
        .filter(other => other.id !== ship.id && chebyshev(ship.position, other.position) <= ship.visionRange)
        .map(other => ({ id: other.id, position: { ...other.position }, hp: other.hp, facing: other.facing }))

    const { radius, phase } = stormAt(world.turn, world.rules)
    const storm = { center: { ...world.storm.center }, radius, phase }
    return { self: { ...ship, position: { ...ship.position } }, visibleShips, map, storm }
}


