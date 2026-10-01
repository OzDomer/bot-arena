import { describe, expect, it } from "vitest"
import { contentBounds, fitView, makeCamera, naturalSize } from "./camera"
import { PRESETS } from "../sim/presets"

describe('makeCamera', () => {

    it('iso origin camera init', () => {
        const cam = makeCamera('iso', PRESETS.bigmap)
        expect(cam.project({ x: 0, y: 20, z: 0 })).toEqual({ x: 16, y: 368 })
    })
    it('top origin camera init', () => {
        const cam = makeCamera('top', PRESETS.bigmap)
        expect(cam.project({ x: 0, y: 20, z: 1 })).toEqual(cam.project({ x: 0, y: 20, z: 0 }))

    })
})


describe('contentBounds', () => {
    it('iso content bound check', () => {
        expect(contentBounds('iso', PRESETS.bigmap)).toEqual({ minX: -640, minY: -32, maxX: 640, maxY: 640 })
    })

    it('top content bound check', () => {
        expect(contentBounds('top', PRESETS.bigmap)).toEqual({ minX: 0, minY: 0, maxX: 800, maxY: 800 })
    })
})

describe('naturalSize', () => {
    it('iso natural size init', () => {
        const size = naturalSize('iso', PRESETS.bigmap)
        expect(size).toEqual({ width: 1312, height: 704 })
    })
    it('top natural size init', () => {
        const size = naturalSize('top', PRESETS.bigmap)
        expect(size).toEqual({ width: 832, height: 832 })

    })
})

describe('fitView', () => {
    it('Fit at natural size reproduces bigmap camera', () => {
        const size = naturalSize('iso', PRESETS.bigmap)
        expect(fitView('iso', PRESETS.bigmap, size.width, size.height)).toEqual({ zoom: 1, pan: { x: 656, y: 48 } })
    })
    it('top: fit at natural size reproduces the old origin', () => {
        const size = naturalSize('top', PRESETS.bigmap)
        expect(fitView('top', PRESETS.bigmap, size.width, size.height)).toEqual({ zoom: 1, pan: { x: 16, y: 16 } })

    })

    it('iso: wider-than-tall content fits on x and centres on y', () => {
        const view = fitView('iso', PRESETS.bigmap, 2000, 2000)
        expect(view.zoom).toBeCloseTo(1.5375)
        expect(view.pan.x).toBeCloseTo(1000)
        expect(view.pan.y).toBeCloseTo(532.6)

    })
})
