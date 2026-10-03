import type { World, Hit } from "../index";
import type { Vec3 } from "./camera";
import { roofCenter } from "./ships";

export type HitMark = { from: Vec3; to: Vec3; amount: number }

export function buildHits(prev: World, hits: Hit[]): HitMark[] {
    const marks: HitMark[] = []
    for (const hit of hits) {
        const attacker = prev.ships.find(s => s.id === hit.attacker)
        const target = prev.ships.find(s => s.id === hit.target)
        if (!attacker || !target) continue
        marks.push({ from: roofCenter(attacker.position), to: roofCenter(target.position), amount: hit.amount })
    }
    return marks
}

