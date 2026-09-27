// render/camera.ts
import type { Rules } from '../types'

export type Vec3 = { x: number; y: number; z: number }
export type Vec2 = { x: number; y: number }
export type ViewMode = 'iso' | 'top'

type Basis = (p: Vec3) => Vec2

type View = { basis: Basis; depth: (p: Vec3) => number }

export const Z_MAX = 1             // tallest drawable, world units — sizes the headroom

const TW = 64   // isometric tile width in pixels
const TH = 32   // isometric tile height in pixels
const ZH = 32   // pixels upward per world unit of z
const T = 40    // top-down tile size in pixels
const MARGIN = 16

const VIEWS: Record<ViewMode, View> = {
    iso: {
        basis: p => ({ x: (p.x - p.y) * TW / 2, y: (p.x + p.y) * TH / 2 - p.z * ZH }),
        depth: p => p.x + p.y,
    },
    top: {
        basis: p => ({ x: p.x * T, y: p.y * T }),
        depth: () => 0
    },
}



export type Camera = {
    mode: ViewMode
    width: number                  // canvas px
    height: number
    project(p: Vec3): Vec2         // world → canvas px, origin applied
    depth(p: Vec3): number         // painter key: larger = nearer = drawn later
}


export function makeCamera(mode: ViewMode, rules: Rules): Camera {
    const view = VIEWS[mode]
    const corners: Vec2[] = []
    for (const x of [0, rules.width]) {
        for (const y of [0, rules.height]) {
            for (const z of [0, Z_MAX]) {
                corners.push(view.basis({ x, y, z }))
            }
        }
    }
    const xs = corners.map(c => c.x)
    const ys = corners.map(c => c.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const originX = MARGIN - minX
    const originY = MARGIN - minY
    const width = (maxX - minX) + 2 * MARGIN
    const height = (maxY - minY) + 2 * MARGIN

    return {
        mode,
        width,
        height,
        project: p => {project(p), },
        depth: view.depth

    }
}