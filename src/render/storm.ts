import { stormAt } from "../index"
import type { Hit, World } from "../index"
import type { Vec3 } from "./camera"
import type { Poly } from "./paint"
import { roofCenter } from "./ships"
import type { Theme } from './theme'


const SEGMENTS = 64


export function buildRing(world: World, theme: Theme): Poly[] {
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

    return [{ pts, stroke: theme.ring, lineWidth: 2, clip }]
}


export type StormMark = { at: Vec3; amount: number }


export function buildStormMarks(prev: World, cur: World, hits: Hit[]): StormMark[] {
    const marks: StormMark[] = []
    for (const ship of prev.ships) {
        if (ship.hp <= 0) continue
            const now = cur.ships.find(s => s.id === ship.id)
            if (!now) continue
            const lost = ship.hp - now.hp
            const hitSum = hits.filter(h => h.target === ship.id).reduce((sum, h) => sum + h.amount, 0)
            const fromHits = Math.min(ship.hp, hitSum)
            const storm = lost - fromHits
            if (storm > 0) marks.push({ at: roofCenter(now.position), amount: storm })   
    }
    return marks
}