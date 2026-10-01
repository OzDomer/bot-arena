import type { World, Ship } from "../types";
import type { Vec3 } from "./camera";
import { roofCenter, seatColor } from "./ships";

export type Label = { at: Vec3; text: string }

export function buildLabels(world: World, names: Record<Ship['id'], string>): Label[] {
    const labels: Label[] = []
    for (const ship of world.ships) {
        if (ship.hp <= 0) continue
        labels.push({ at: roofCenter(ship.position), text: `${names[ship.id] ?? ship.id}` })
    }
    return labels
}

export type HpBar = { at: Vec3; hp: number; maxHp: number; color: string }

export function buildHpBars(world: World): HpBar[] {
    const bars: HpBar[] = []
    for (const ship of world.ships) {
        if (ship.hp <= 0) continue
        const shipColor = seatColor(ship.id, world.ships.length)
        bars.push({ at: roofCenter(ship.position), hp: ship.hp, maxHp: ship.maxHp, color: shipColor })
    }
    return bars
}