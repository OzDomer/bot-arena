import type { World } from "../types";
import type { Vec3 } from "./camera";
import { seatColor, SHIP_H } from "./ships";

export type HpBar = { at: Vec3; hp: number; maxHp: number; color: string }

export function buildHpBars(world: World): HpBar[] {
    const bars: HpBar[] = []
    for (const ship of world.ships) {
        if (ship.hp <= 0) continue
        const { x, y } = ship.position
        const at: Vec3 = { x: x + 0.5, y: y + 0.5, z: SHIP_H }
        const shipColor = seatColor(ship.id, world.ships.length)
        bars.push({ at, hp: ship.hp, maxHp: ship.maxHp, color: shipColor })
    }
    return bars
}