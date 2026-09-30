import { type Ship, type World } from "../types"
import type { Camera } from "./camera"
import { buildFloor } from "./floor"
import { buildLabels, type Label } from "./labels";
import { paint } from "./paint"
import { buildShips } from "./ships";

const LABEL_LIFT = 6


export function drawWorld(ctx: CanvasRenderingContext2D, cam: Camera, world: World, names: Record<Ship['id'], string>) {
    ctx.save()
    ctx.clearRect(0, 0, cam.width, cam.height)
    paint(ctx, cam, buildFloor(world))
    paint(ctx, cam, buildShips(world))
    drawLabels(ctx, cam, buildLabels(world, names))
    ctx.restore()
}

export function drawLabels(ctx: CanvasRenderingContext2D, cam: Camera, labels: Label[]) {
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'       // x is the text's middle
    ctx.textBaseline = 'bottom'    // y is the text's bottom edge
    ctx.lineWidth = 3
    ctx.strokeStyle = '#000'
    ctx.fillStyle = '#fff'

    for (const label of labels) {
        const p = cam.project(label.at)
        const y = p.y - LABEL_LIFT
        ctx.strokeText(label.text, p.x, y)
        ctx.fillText(label.text, p.x, y)
    }

}