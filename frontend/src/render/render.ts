import { type Frame, type Ship, type Weights, type World } from "@arena/sim"
import type { Camera } from "./camera"
import { buildFloor } from "./floor"
import { buildHits, type HitMark } from "./combat";
import { buildIntent } from "./intent";
import { paint } from "./paint"
import { buildShips } from "./ships";
import { buildHpBars, buildLabels, type Label, type HpBar } from "./plate";
import { buildRing, buildStormMarks, type StormMark } from "./storm";
import type { Theme } from "./theme";

const BAR_W = 30
const BAR_H = 6
const BAR_GAP = 1
const BAR_LIFT = 8
const LABEL_LIFT = BAR_LIFT + BAR_H + 3    // name sits 3px above the bar

export type SceneOpts = { names: Record<Ship['id'], string>; intent: Record<Ship['id'], Weights>; theme: Theme }

function outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string) {
    ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(text, x, y)
    ctx.fillStyle = fill; ctx.fillText(text, x, y)
}


export function drawWorld(ctx: CanvasRenderingContext2D, cam: Camera, frame: Frame, prev: World, opts: SceneOpts) {
    const { world, hits } = frame
    ctx.save()
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    paint(ctx, cam, buildFloor(world, opts.theme))
    paint(ctx, cam, buildRing(world, opts.theme))
    paint(ctx, cam, [...buildShips(world, opts.theme), ...buildIntent(world, opts.intent)])
    drawBars(ctx, cam, buildHpBars(world), opts.theme)
    drawHits(ctx, cam, buildHits(prev, hits), opts.theme)
    drawStormMarks(ctx, cam, buildStormMarks(prev, world, hits), opts.theme)
    drawLabels(ctx, cam, buildLabels(world, opts.names), opts.theme)
    ctx.restore()
}

export function drawLabels(ctx: CanvasRenderingContext2D, cam: Camera, labels: Label[], theme: Theme) {
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'       // x is the text's middle
    ctx.textBaseline = 'bottom'    // y is the text's bottom edge
    for (const label of labels) {
        const p = cam.project(label.at)
        outlinedText(ctx, label.text, p.x, p.y - LABEL_LIFT, theme.label)
    }

}

export function drawBars(ctx: CanvasRenderingContext2D, cam: Camera, bars: HpBar[], theme: Theme) {
    for (const bar of bars) {
        const b = cam.project(bar.at)
        const y = b.y - BAR_LIFT
        const x0 = b.x - BAR_W / 2
        const cell = (BAR_W - (bar.maxHp - 1) * BAR_GAP) / bar.maxHp
        ctx.fillStyle = theme.barBg
        ctx.fillRect(x0 - 1, y - BAR_H - 1, BAR_W + 2, BAR_H + 2)
        for (let i = 0; i < bar.maxHp; i++) {
            ctx.fillStyle = i < bar.hp ? bar.color : theme.barEmpty
            ctx.fillRect(x0 + i * (cell + BAR_GAP), y - BAR_H, cell, BAR_H)
        }
    }
}

function drawHits(ctx: CanvasRenderingContext2D, cam: Camera, marks: HitMark[], theme: Theme) {
    ctx.lineCap = 'round'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    for (const m of marks) {
        const a = cam.project(m.from), b = cam.project(m.to)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.lineWidth = 3 + m.amount; ctx.strokeStyle = theme.outline; ctx.stroke()
        ctx.lineWidth = 1 + m.amount; ctx.strokeStyle = theme.hit; ctx.stroke()
    }
    for (const m of marks) {
        const b = cam.project(m.to)
        outlinedText(ctx, `-${m.amount}`, b.x + 10, b.y - 2, '#fff')
    }
}


function drawStormMarks(ctx: CanvasRenderingContext2D, cam: Camera, marks: StormMark[], theme:Theme) {
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    for (const m of marks) {
        const b = cam.project(m.at)
        outlinedText(ctx, `-${m.amount}`, b.x - 10, b.y - 2, theme.stormText)
    }
}