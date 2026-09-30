import { DELTAS, type World } from "../types"
import { hslToHex, shade } from "./color"
import type { Poly } from "./paint"

const SEAT_S = 0.65, SEAT_L = 0.5
export const seatColor = (id: number, count: number) =>
    hslToHex((id - 1) * 360 / count, SEAT_S, SEAT_L)

const INSET = 0.15   // gap between ship and tile edge, in tiles
export const SHIP_H = 0.6    // live ship height, in tiles
export const WRECK_H = 0.1   // sunk: a low hull at water level
const SIDE_SHADE = [0.9, 0.75, 0.55, 0.9]   // N, E, S, W — E and S are the ones iso shows
const NOSE = '#222'
const NOSE_TIP = 0.3    // center → tip, along the facing
const NOSE_BACK = 0.15  // center → back edge, against the facing
const NOSE_HALF = 0.15  // back edge half-width, sideways


export function buildShips(world: World): Poly[] {
    const polys: Poly[] = []
    for (const ship of world.ships) {
        const h = ship.hp > 0 ? SHIP_H : WRECK_H
        const shipColor = seatColor(ship.id, world.ships.length)
        const color = ship.hp > 0 ? shipColor : shade(shipColor, 0.45)
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
        if (ship.hp > 0) {
            const { dx, dy } = DELTAS[ship.facing]
            const len = Math.hypot(dx, dy)
            const ux = dx / len
            const uy = dy / len
            const sx = -uy
            const sy = ux

            const tip = { x: anchor.x + ux * NOSE_TIP, y: anchor.y + uy * NOSE_TIP, z: h }

            const bx = anchor.x - ux * NOSE_BACK      // helper: middle of the back edge
            const by = anchor.y - uy * NOSE_BACK

            const corner1 = { x: bx + sx * NOSE_HALF, y: by + sy * NOSE_HALF, z: h }
            const corner2 = { x: bx - sx * NOSE_HALF, y: by - sy * NOSE_HALF, z: h }

            polys.push({ pts: [tip, corner1, corner2], fill: NOSE, anchor })
        }
    }
    return polys
}
