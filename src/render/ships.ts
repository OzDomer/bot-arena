import type { World } from "../types"
import { shade } from "./color"
import type { Poly } from "./paint"

const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8338ec']
export const DEAD = '#999'
const INSET = 0.15   // gap between ship and tile edge, in tiles
export const SHIP_H = 0.6    // live ship height, in tiles
export const WRECK_H = 0.1   // sunk: a low hull at water level
const SIDE_SHADE = [0.9, 0.75, 0.55, 0.9]   // N, E, S, W — E and S are the ones iso shows

export function buildShips(world: World): Poly[] {
    const polys: Poly[] = []
    for (const ship of world.ships) {
        const h = ship.hp > 0 ? SHIP_H : WRECK_H
        const seatColor = COLORS[ship.id % COLORS.length]
        const color = ship.hp > 0 ? seatColor : shade(seatColor, 0.45)
        const { x, y } = ship.position
        const anchor = { x: x + 0.5, y: y + 0.5, z: 0 }
        const x0 = x + INSET
        const x1 = x + 1 - INSET
        const y0 = y + INSET
        const y1 = y + 1 - INSET
        const foot = [
            { x: x0, y: y0, z: 0 },
            { x: x1, y: y0, z: 0 },
            { x: x1, y: y1, z: 0 },
            { x: x0, y: y1, z: 0 },
        ]
        polys.push({
            pts: foot.map(p => ({ ...p, z: h })),
            fill: color,
            stroke: '#333',
            anchor,
        })
        for (let k = 0; k < 4; k++) {
            const a = foot[k]                  
            const b = foot[(k + 1) % 4]        
            polys.push({
                pts: [a, b, { ...b, z: h }, { ...a, z: h }],
                fill: shade(color, SIDE_SHADE[k]),
                stroke: '#333',
                anchor,
            })
        }

    }
    return polys
}
