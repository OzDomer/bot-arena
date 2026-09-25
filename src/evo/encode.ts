import { chebyshev } from "../sim/geometry";
import { type Facing, type Observation } from "../types";

export const ENCODE_DELTAS: Record<Facing, { dx: number; dy: number }> = {
    N: { dx: 0, dy: -1 },
    NE: { dx: Math.SQRT1_2, dy: -Math.SQRT1_2 },
    E: { dx: 1, dy: 0 },
    SE: { dx: Math.SQRT1_2, dy: Math.SQRT1_2 },
    S: { dx: 0, dy: 1 },
    SW: { dx: -Math.SQRT1_2, dy: Math.SQRT1_2 },
    W: { dx: -1, dy: 0 },
    NW: { dx: -Math.SQRT1_2, dy: -Math.SQRT1_2 }
}

// [0]     self hp / maxHp
// [1..2]  self facing (dx, dy on unit circle)
// [3..5]  storm: center dx, dy, radius — all / max(w, h)
// [6..17] 3 slots × [present, dx/vision, dy/vision, hp/maxHp], nearest first


export function encode(obs: Observation): number[] {
    const out: number[] = []
    const scale = Math.max(obs.map.width, obs.map.height)
    out.push(obs.self.hp / obs.self.maxHp)
    out.push(ENCODE_DELTAS[obs.self.facing].dx, ENCODE_DELTAS[obs.self.facing].dy)
    out.push((obs.storm.center.x - obs.self.position.x) / scale)
    out.push((obs.storm.center.y - obs.self.position.y) / scale)
    out.push(obs.storm.radius / scale)
    const alive = obs.visibleShips.filter(s => s.hp > 0)// this gives alive visibleships are 
    const aliveSorted = alive.sort((a, b) => chebyshev(obs.self.position, a.position) - chebyshev(obs.self.position, b.position))
    for (let i = 0; i < 3; i++) {
        const ship = aliveSorted[i]
        if (ship === undefined) {
            out.push(0, 0, 0, 0)
            continue
        }
        out.push(1)
        out.push((ship.position.x - obs.self.position.x) / obs.self.visionRange)
        out.push((ship.position.y - obs.self.position.y) / obs.self.visionRange)
        out.push(ship.hp / obs.self.maxHp)
    }
    return out
}