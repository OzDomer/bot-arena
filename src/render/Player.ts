import { clamp } from '../sim/geometry';
import type { World } from '../types';
import type { Camera } from './camera';
import { drawWorld } from './render';

export class Player {
    private i = 0;
    private timer: ReturnType<typeof setInterval> | undefined

    private ctx: CanvasRenderingContext2D
    private cam: Camera
    private history: World[]
    private turnEl: HTMLElement

    constructor(ctx: CanvasRenderingContext2D, cam: Camera, history: World[], turnEl: HTMLElement) {
        this.ctx = ctx
        this.cam = cam
        this.history = history
        this.turnEl = turnEl
        this.show(0)
    }

    private show(i: number) {
        this.i = clamp(i, 0, this.history.length - 1)
        const frame = this.history[this.i]
        drawWorld(this.ctx, this.cam, frame)
        this.turnEl.textContent = `${frame.turn}`
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
}
