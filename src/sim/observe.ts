import type { Observation, Ship, World } from "../types";
import { manhattan } from "./geometry";

export function observe(world: World, ship: Ship): Observation {
    const { ships, ...map } = world;   // map = world minus ships

    const visibleShips = ships
        .filter(other => other.id !== ship.id && manhattan(ship.position, other.position) <= ship.visionRange)
        .map(other => ({ id: other.id, position: other.position, hp: other.hp }))

    return { self: ship, visibleShips, map };
}


