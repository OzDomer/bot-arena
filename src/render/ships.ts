import type { World } from "../types"
import type { Poly } from "./paint"

const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8338ec']
export const DEAD = '#999'
const INSET = 0.15   // gap between ship and tile edge, in tiles

export function buildShipsFlat(world: World): Poly[] {
    const polys: Poly[] = []
    for (const ship of world.ships) {
        const { x, y } = ship.position
        const x0 = x + INSET
        const x1 = x + 1 - INSET
        const y0 = y + INSET
        const y1 = y + 1 - INSET
        polys.push({
            pts: [
                { x: x0, y: y0, z: 0 },
                { x: x1, y: y0, z: 0 },
                { x: x1, y: y1, z: 0 },
                { x: x0, y: y1, z: 0 }

            ],
            fill: ship.hp <= 0 ? DEAD : COLORS[ship.id % COLORS.length],
            stroke: '#333'
        })

    }
    return polys
}
