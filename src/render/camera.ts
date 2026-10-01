// render/camera.ts
import type { Rules } from '../types'

export type Vec3 = { x: number; y: number; z: number }
export type Vec2 = { x: number; y: number }
export type ViewMode = 'iso' | 'top'
export type View = { zoom: number; pan: Vec2 }
export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

type Basis = (p: Vec3) => Vec2

type Projection = { basis: Basis; depth: (p: Vec3) => number }

export const Z_MAX = 1             // tallest drawable, world units — sizes the headroom

const TW = 64   // isometric tile width in pixels
const TH = 32   // isometric tile height in pixels
const ZH = 32   // pixels upward per world unit of z
const T = 40    // top-down tile size in pixels
const MARGIN = 16

const PROJECTIONS: Record<ViewMode, Projection> = {
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
    project(p: Vec3): Vec2        // basis(p) * zoom + pan
    depth(p: Vec3): number        // unchanged: world-space, view-independent
}


export function makeCamera(mode: ViewMode, rules: Rules): Camera {
    const proj = PROJECTIONS[mode]
    const { minX, minY } = contentBounds(mode, rules)
    const originX = MARGIN - minX
    const originY = MARGIN - minY
    return {
        mode,
        project: p => {
            const raw = proj.basis(p)
            return { x: raw.x + originX, y: raw.y + originY }
        },
        depth: proj.depth

    }
}


export function contentBounds(mode: ViewMode, rules: Rules): Bounds {
    const corners: Vec2[] = []
    const basis = PROJECTIONS[mode].basis
    for (const x of [0, rules.width]) {
        for (const y of [0, rules.height]) {
            for (const z of [0, Z_MAX]) {
                corners.push(basis({ x, y, z }))
            }
        }
    }
    const xs = corners.map(c => c.x)
    const ys = corners.map(c => c.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return { minX, minY, maxX, maxY }
}

export function naturalSize(mode: ViewMode, rules: Rules, pad = MARGIN): { width: number; height: number } {
const b = contentBounds(mode, rules)
return { width: b.maxX - b.minX + 2 * pad, height: b.maxY - b.minY + 2 * pad }
}