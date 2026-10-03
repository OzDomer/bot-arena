import { DELTAS, type Facing, type Position, type World } from "@arena/sim"
import type { Vec3 } from "./camera"
import { hslToHex, shade } from "./color"
import type { Poly } from "./paint"
import type { Theme } from "./theme"

export const roofCenter = (p: Position): Vec3 => ({ x: p.x + 0.5, y: p.y + 0.5, z: SHIP_H })


const SEAT_S = 0.65, SEAT_L = 0.5
export const seatColor = (id: number, count: number) =>
    hslToHex((id - 1) * 360 / count, SEAT_S, SEAT_L)

export const SHIP_H = 0.6    // live ship height, in tiles
export const WRECK_H = 0.1   // sunk: a low hull at water level

export function buildShips(world: World, theme:Theme): Poly[] {
    const polys: Poly[] = []
    for (const ship of world.ships) {
        const h = ship.hp > 0 ? SHIP_H : WRECK_H
        const shipColor = seatColor(ship.id, world.ships.length)
        const color = ship.hp > 0 ? shipColor : shade(shipColor, 0.45)
        const { x, y } = ship.position
        const anchor = { x: x + 0.5, y: y + 0.5, z: 0 }
        const foot = hullFootprint(anchor, ship.facing)
        polys.push({
            pts: foot.map(p => ({ ...p, z: h })),
            fill: color,
            stroke: theme.shipStroke,
            anchor,
        })
        for (let k = 0; k < foot.length; k++) {
            const a = foot[k]
            const b = foot[(k + 1) % foot.length]
            polys.push({
                pts: [a, b, { ...b, z: h }, { ...a, z: h }],
                fill: shade(color, sideShade(a, b)),
                stroke: theme.shipStroke,
                anchor,
            })
        }
    }
    return polys

}

const HULL_W = 0.2
const HULL_B = 0.25
const HULL_F = 0.1
export const HULL_T = 0.35
const LOCAL: [number, number][] = [[-HULL_B, -HULL_W], [HULL_F, -HULL_W], [HULL_T, 0], [HULL_F, HULL_W], [-HULL_B, HULL_W]]

export function hullFootprint(center: Position, facing: Facing): Vec3[] {
    const { dx, dy } = DELTAS[facing]
    const angle = Math.atan2(dy, dx)
    const c = Math.cos(angle), s = Math.sin(angle)
    return LOCAL.map(([lx, ly]) => ({ x: center.x + lx * c - ly * s, y: center.y + lx * s + ly * c, z: 0 }))
}

export function sideShade(a: Vec3, b: Vec3): number {
    const LIGHT = { x: -Math.SQRT1_2, y: -Math.SQRT1_2 }
    const ex = b.x - a.x
    const ey = b.y - a.y
    const length = Math.sqrt(ex * ex + ey * ey)
    const nx = ey / length
    const ny = -ex / length
    return 0.72 + 0.18 * (nx * LIGHT.x + ny * LIGHT.y)

}