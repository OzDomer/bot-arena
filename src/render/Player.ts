import { clamp } from '../index'
import type { Frame, Ship, Weights } from '../index'
import type { Camera } from './camera'
import { drawWorld } from './render'
import type { Theme } from './theme'

export class Player {
    private i = 0;
    private timer: ReturnType<typeof setInterval> | undefined

    private ctx: CanvasRenderingContext2D
    private cam: Camera
    private history: Frame[]
    private turnEl: HTMLElement
    private names: Record<Ship['id'], string>
    private intent: Record<Ship['id'], Weights>
    private showIntent = true
    private theme: Theme



    constructor(ctx: CanvasRenderingContext2D, cam: Camera, history: Frame[], turnEl: HTMLElement, names: Record<Ship['id'], string>, intent: Record<Ship['id'], Weights>, theme:Theme) {
        this.ctx = ctx
        this.cam = cam
        this.history = history
        this.turnEl = turnEl
        this.names = names
        this.intent = intent
        this.theme = theme
        this.show(0)
    }

    private show(i: number) {
        this.i = clamp(i, 0, this.history.length - 1)
        const frame = this.history[this.i]
        const prev = this.history[Math.max(0, this.i - 1)].world
        drawWorld(this.ctx, this.cam, frame, prev, { names: this.names, intent: this.showIntent ? this.intent : {}, theme: this.theme })
        this.turnEl.textContent = `${frame.world.turn}`
    }

    play() {
        if (this.timer !== undefined) return;
        this.timer = setInterval(() => {
            this.stepForward();
            if (this.i >= this.history.length - 1) this.pause();
        }, 150);
    }
    pause() { clearInterval(this.timer); this.timer = undefined }
    stepForward() { this.show(this.i + 1); }
    stepBack() { this.show(this.i - 1); }

    setCamera(cam: Camera) {
        this.cam = cam
        this.show(this.i)
    }
    toggleIntent() {
        this.showIntent = !this.showIntent
        this.show(this.i)
    }

        setTheme(theme: Theme) {
        this.theme = theme
        this.show(this.i)
    }
}
