import { stormAt } from "../sim/storm"
import type { World } from "../types"
import type { Vec3 } from "./camera"
import type { Poly } from "./paint"

const SEGMENTS = 64
const RING = '#4040c0'

export function buildRing(world: World): Poly[] {
    const radius = stormAt(world.turn, world.rules).radius
    if (radius < 0) return []
    const { width: W, height: H } = world.rules
    const clip = [{ x: 0, y: 0, z: 0 }, { x: W, y: 0, z: 0 }, { x: W, y: H, z: 0 }, { x: 0, y: H, z: 0 }]
    const cx = world.storm.center.x + 0.5
    const cy = world.storm.center.y + 0.5
    const pts: Vec3[] = []
    for (let k = 0; k < SEGMENTS; k++) {
        const theta = k * 2 * Math.PI / SEGMENTS
        pts.push({ x: cx + radius * Math.cos(theta), y: cy + radius * Math.sin(theta), z: 0 })
    }

    return [{ pts, stroke: RING, lineWidth: 2, clip }]
}