import type { Observation, Position, Ship, World } from "../types";

export function observe(world: World, ship: Ship): Observation {
    const { ships, ...map } = world;   // map = world minus ships

    const visibleShips = ships
        .filter(other => other.id !== ship.id && manhattan(ship.position, other.position) <= ship.visionRange)
        .map(other => ({ id: other.id, position: other.position, hp: other.hp }))

    return { self: ship, visibleShips, map };
}


function manhattan(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}