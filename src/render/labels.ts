import type { World, Ship } from "../types";
import type { Vec3 } from "./camera";
import { SHIP_H } from "./ships";

export type Label = { at: Vec3; text: string }

export function buildLabels(world: World, names: Record<Ship['id'], string>): Label[] {
    const labels: Label[] = []
    for (const ship of world.ships) {
        if (ship.hp <= 0) continue
        labels.push({ at: { x: ship.position.x + 0.5, y: ship.position.y + 0.5, z: SHIP_H }, text: `${names[ship.id] ?? ship.id}` })
    }
    return labels
}
