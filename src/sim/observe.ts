import type { Observation, Ship, World } from "../types";
import { chebyshev } from "./geometry";
import { stormAt } from "./storm";

export function observe(world: World, ship: Ship): Observation {
    const { ships, ...map } = world;   // map = world minus ships

    const visibleShips = ships
        .filter(other => other.id !== ship.id && chebyshev(ship.position, other.position) <= ship.visionRange)
        .map(other => ({ id: other.id, position: { ...other.position }, hp: other.hp, facing: other.facing }))

    const storm = { center: { ...world.storm.center }, ...stormAt(world.turn, world.rules) }
    return { self: { ...ship, position: { ...ship.position } }, visibleShips, map, storm }
}


