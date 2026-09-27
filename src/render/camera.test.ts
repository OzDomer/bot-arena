import { describe, expect, it } from "vitest"
import { makeCamera } from "./camera"
import { PRESETS } from "../sim/presets"

describe('makeCamera', () => {
    it('iso camera init', () => {
        const cam = makeCamera('iso', PRESETS.bigmap)
        expect(cam.width).toBe(1312)
        expect(cam.height).toBe(704)
    })
    it('top camera init', () => {
        const cam = makeCamera('top', PRESETS.bigmap)
        expect(cam.width).toBe(832)
        expect(cam.height).toBe(832)
    })

    it('iso origin camera init', () => {
        const cam = makeCamera('iso', PRESETS.bigmap)
        expect(cam.project({ x: 0, y: 20, z: 0 })).toEqual({ x: 16, y: 368 })
    })
    it('top origin camera init', () => {
        const cam = makeCamera('top', PRESETS.bigmap)
        expect(cam.project({ x: 0, y: 20, z: 1 })).toEqual(cam.project({ x: 0, y: 20, z: 0 }))

    })
})
