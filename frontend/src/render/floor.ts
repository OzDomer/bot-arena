import { inCircle } from "@arena/sim";
import { stormAt } from "@arena/sim";
import type { World } from "@arena/sim";
import { type Poly } from "./paint";
import type { Theme } from './theme'


export function buildFloor(world: World, theme: Theme): Poly[] {
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

                ], fill: inStorm ? theme.floorStorm : theme.floorSafe,
                stroke: theme.floorLine
            })
        }
    }
    return polys
}