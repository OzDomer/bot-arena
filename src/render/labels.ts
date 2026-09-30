import type { World, Ship } from "../types";
import type { Vec3 } from "./camera";
import { roofCenter } from "./ships";

export type Label = { at: Vec3; text: string }

export function buildLabels(world: World, names: Record<Ship['id'], string>): Label[] {
    const labels: Label[] = []
    for (const ship of world.ships) {
        if (ship.hp <= 0) continue
        labels.push({ at: roofCenter(ship.position) , text: `${names[ship.id] ?? ship.id}` })
    }
    return labels
}
