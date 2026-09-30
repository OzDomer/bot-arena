import type { Camera, Vec2, Vec3 } from "./camera";

export type Poly = { pts: Vec3[], fill?: string, stroke?: string, lineWidth?: number, anchor?: Vec3, clip?: Vec3[] }

export const CULL_EPS = 1e-6


export function signedArea(pts: Vec2[]): number {
    let area = 0
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i]
        const b = pts[(i + 1) % pts.length]
        area += a.x * b.y - b.x * a.y
    }
    return area / 2
}


export function paint(ctx: CanvasRenderingContext2D, cam: Camera, polys: Poly[]): void {
    const depthOf = (p: Poly) => p.anchor ? cam.depth(p.anchor) : 0
    const ordered = [...polys].sort((a, b) => depthOf(a) - depthOf(b))
    for (const poly of ordered) {
        const screen = poly.pts.map(p => cam.project(p))
        if (signedArea(screen) <= CULL_EPS) continue

        if (poly.clip) {                                        // 1. start clipping (optional)
            ctx.save()
            tracePath(ctx, poly.clip.map(p => cam.project(p)))
            ctx.clip()
        }

        tracePath(ctx, screen)                                  // 2. outline of this poly

        if (poly.fill) {                                        // 3. fill
            ctx.fillStyle = poly.fill
            ctx.fill()
        }
        if (poly.stroke) {                                      // 4. stroke
            ctx.strokeStyle = poly.stroke
            ctx.lineWidth = poly.lineWidth ?? 1
            ctx.stroke()
        }

        if (poly.clip) ctx.restore()                            // 5. stop clipping (optional)
    }
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Vec2[]) {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
}