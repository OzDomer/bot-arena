import type { Weights } from "../evo/net";
import { type Ship, type World } from "../types"
import type { Camera } from "./camera"
import { buildFloor } from "./floor"
import { buildHpBars, type HpBar } from "./hpBars";
import { buildIntent } from "./intent";
import { buildLabels, type Label } from "./labels";
import { paint } from "./paint"
import { buildRing } from "./ring";
import { buildShips } from "./ships";

const BAR_W = 30
const BAR_H = 6
const BAR_GAP = 1
const BAR_LIFT = 8
const LABEL_LIFT = BAR_LIFT + BAR_H + 3    // name sits 3px above the bar
export function drawWorld(ctx: CanvasRenderingContext2D, cam: Camera, world: World, names: Record<Ship['id'], string>, intent: Record<Ship['id'], Weights>) {
    ctx.save()
    ctx.clearRect(0, 0, cam.width, cam.height)
    paint(ctx, cam, buildFloor(world))
    paint(ctx, cam, buildRing(world))
    paint(ctx, cam, [...buildShips(world), ...buildIntent(world, intent)])
    drawBars(ctx, cam, buildHpBars(world))
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

export function drawBars(ctx: CanvasRenderingContext2D, cam: Camera, bars: HpBar[]) {
    for (const bar of bars) {
        const b = cam.project(bar.at)
        const y = b.y - BAR_LIFT
        const x0 = b.x - BAR_W / 2
        const cell = (BAR_W - (bar.maxHp - 1) * BAR_GAP) / bar.maxHp
        ctx.fillStyle = '#111'
        ctx.fillRect(x0 - 1, y - BAR_H - 1, BAR_W + 2, BAR_H + 2)
        ctx.fillStyle = '#111'
        ctx.fillRect(x0 - 1, y - BAR_H - 1, BAR_W + 2, BAR_H + 2)
        for (let i = 0; i < bar.maxHp; i++) {
            ctx.fillStyle = i < bar.hp ? bar.color : '#333'
            ctx.fillRect(x0 + i * (cell + BAR_GAP), y - BAR_H, cell, BAR_H)
        }
    }
}