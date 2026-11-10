import { clamp } from '@arena/sim'
import type { Frame, Ship, Weights } from '@arena/sim'
import type { Camera } from './camera'
import { drawWorld } from './render'
import type { Theme } from './theme'
import { frameForTime, type LivePlayback } from '../shared/liveTime'

export const FRAME_MS = 150

export class Player {
    private i = 0;
    private timer: ReturnType<typeof setInterval> | undefined

    private ctx: CanvasRenderingContext2D
    private cam: Camera
    private history: Frame[]
    private onFrame: (turn: number) => void
    private names: Record<Ship['id'], string>
    private intent: Record<Ship['id'], Weights>
    private showIntent = true
    private theme: Theme
    private frameMs = FRAME_MS



    constructor(ctx: CanvasRenderingContext2D, cam: Camera, history: Frame[], onFrame: (turn: number) => void, names: Record<Ship['id'], string>, intent: Record<Ship['id'], Weights>, theme: Theme) {
        this.ctx = ctx
        this.cam = cam
        this.history = history
        this.onFrame = onFrame
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
        this.onFrame(frame.world.turn)
    }

    play() {
        if (this.timer !== undefined) return;
        this.timer = setInterval(() => {
            this.stepForward();
            if (this.i >= this.history.length - 1) this.pause();
        }, this.frameMs);
    }
    pause() { clearInterval(this.timer); this.timer = undefined }
    stepForward() { this.show(this.i + 1); }
    stepBack() { this.show(this.i - 1); }

    playLive(live: LivePlayback) {
        this.pause()
        const sync = () => {
            const lastFrame = this.history.length - 1
            const frame = live.settled ? lastFrame : frameForTime(live.startsAt, live.msPerTurn, lastFrame, live.now())
            if (frame !== this.i) this.show(frame)
        }
        sync()
        if (!live.settled) this.timer = setInterval(sync, Math.min(16, live.msPerTurn))
    }

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
    setFrameMs(frameMS: number) {
        this.frameMs = frameMS
        if (this.timer !== undefined) {
            this.pause()
            this.play()
        }
    }
}

