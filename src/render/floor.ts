import { inCircle } from "../sim/geometry";
import { stormAt } from "../sim/storm";
import type { World } from "../types";
import { type Poly } from "./paint";

export const FLOOR = { safe: '#ccc', storm: '#8a8ad0', line: '#999' }

export function buildFloor(world: World): Poly[] {
    const polys: Poly[] = []
    const { radius } = stormAt(world.turn, world.rules)
    for (let i = 0; i < world.rules.width; i++) {
        for (let j = 0; j < world.rules.height; j++) {
            const inStorm = !inCircle({ x: i, y: j }, world.storm.center, radius)
            polys.push({
                pts: [
                    { x: i, y: j, z: 0 },
                    { x: i + 1, y: j, z: 0 },
                    { x: i + 1, y: j + 1, z: 0 },
                    { x: i, y: j + 1, z: 0 }

                ], fill: inStorm ? FLOOR.storm : FLOOR.safe, stroke: FLOOR.line 
            })
        }
    }
    return polys
}