import type { Camera, Vec2, Vec3 } from "./camera";

export type Poly = { pts: Vec3[]; fill?: string; stroke?: string; lineWidth?: number }

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
    for (const poly of polys) {
        const screen = poly.pts.map(p => cam.project(p))
        if (signedArea(screen) <= CULL_EPS) continue
        ctx.beginPath()
        ctx.moveTo(screen[0].x, screen[0].y)
        for (let i = 1; i < screen.length; i++) {
            ctx.lineTo(screen[i].x, screen[i].y)
        }
        ctx.closePath()
        if (poly.fill) {
            ctx.fillStyle = poly.fill
            ctx.fill()
        }
        if (poly.stroke) {
            ctx.strokeStyle = poly.stroke
            ctx.lineWidth = poly.lineWidth ?? 1
            ctx.stroke()
        }
    }