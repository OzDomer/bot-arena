import { softmax,observe, forward, argMax, encode, versionFor } from "@arena/sim"
import { type World, type Ship, DIRECTIONS, DELTAS, type Weights } from "@arena/sim"
import type { Poly } from "./paint"
import { SHIP_H } from "./ships"

const ARROW_MAX = 0.45    // length at probability 1: reaches the tile edge
const ARROW_W = 0.1      // half-width of an arrow, in tiles
const DOT_MAX = 0.08       // STAY square half-side at probability 1
const ARROW = '#f0f0f0'
const CHOSEN = '#ffd60a'  // the argmax move


export function buildIntent(world: World, intent: Record<Ship['id'], Weights>): Poly[] {
    const polys: Poly[] = []
    for (const ship of world.ships) {
        const weights = intent[ship.id]
        if (ship.hp <= 0 || !weights) continue
        const obs = observe(world, ship)
        const probs = softmax(forward(weights, encode(obs, versionFor(weights[0].length - 1))))
        const chosen = argMax(probs)
        const cx = ship.position.x + 0.5, cy = ship.position.y + 0.5
        const anchor = { x: cx, y: cy, z: 0 }
        const maxP = Math.max(...probs)
        const stay = DIRECTIONS.indexOf('STAY')
        const r = DOT_MAX * probs[stay] / maxP
        polys.push({
            pts: [
                { x: cx - r, y: cy - r, z: SHIP_H },
                { x: cx + r, y: cy - r, z: SHIP_H },
                { x: cx + r, y: cy + r, z: SHIP_H },
                { x: cx - r, y: cy + r, z: SHIP_H },
            ], fill: stay === chosen ? CHOSEN : ARROW,
            anchor
        })
        for (let i = 0; i < probs.length; i++) {
            const rel = probs[i] / maxP    // 1 for the chosen move, fractions for the rest
            const dir = DIRECTIONS[i]              // 'N', 'NE', …, 'STAY'
            const fill = i === chosen ? CHOSEN : ARROW
            if (dir === 'STAY') {

                continue

            }
            const { dx, dy } = DELTAS[dir]
            const len = Math.hypot(dx, dy)
            const ux = dx / len, uy = dy / len
            const sx = -uy, sy = ux
            const tx = cx + ux * ARROW_MAX * rel
            const ty = cy + uy * ARROW_MAX * rel
            polys.push({
                pts: [
                    { x: cx - sx * ARROW_W, y: cy - sy * ARROW_W, z: SHIP_H },   // center, −sideways
                    { x: tx - sx * ARROW_W, y: ty - sy * ARROW_W, z: SHIP_H },   // tip, −sideways
                    { x: tx + sx * ARROW_W, y: ty + sy * ARROW_W, z: SHIP_H },   // tip, +sideways
                    { x: cx + sx * ARROW_W, y: cy + sy * ARROW_W, z: SHIP_H },   // center, +sideways
                ], fill, anchor
            })
        }
    }
    return polys
}