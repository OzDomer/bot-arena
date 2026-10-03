import { describe, expect, it } from "vitest"
import { contentBounds, fitView, makeCamera, naturalSize, panBy, ZOOM_MAX, ZOOM_MIN, zoomAt } from "./camera"
import { PRESETS } from "@arena/sim"
import { testCamera } from "./fixtures"

const size = naturalSize('iso', PRESETS.bigmap)
const view = fitView('iso', PRESETS.bigmap, size.width, size.height)
const p = { x: 7.3, y: 12.1, z: 0.6 }


describe('makeCamera', () => {

    it('iso origin camera init', () => {
        const isoCam = testCamera('iso')
        expect(isoCam.project({ x: 0, y: 20, z: 0 })).toEqual({ x: 16, y: 368 })
    })
    it('top origin camera init', () => {
        const topCam = testCamera('top')
        expect(topCam.project({ x: 0, y: 20, z: 1 })).toEqual(topCam.project({ x: 0, y: 20, z: 0 }))

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


describe('zoomAt', () => {

    it('worked example: x2 at (100,100) from origin', () => {
        expect(zoomAt({ zoom: 1, pan: { x: 0, y: 0 } }, { x: 100, y: 100 }, 2)).toEqual({ zoom: 2, pan: { x: -100, y: -100 } })
    })

    it.each([1.25, 0.8])('iso: point under the cursor stays under the cursor (factor %s)', factor => {
        const s = makeCamera('iso', view).project(p)
        const after = makeCamera('iso', zoomAt(view, s, factor)).project(p)
        expect(after.x).toBeCloseTo(s.x)
        expect(after.y).toBeCloseTo(s.y)
    })
    it.each([
        [1e6, ZOOM_MAX],
        [1e-6, ZOOM_MIN],
    ])('iso: factor %s clamps to %s and keeps the anchor', (factor, limit) => {
        const s = makeCamera('iso', view).project(p)
        const zoomed = zoomAt(view, s, factor)
        expect(zoomed.zoom).toBe(limit)
        const after = makeCamera('iso', zoomed).project(p)
        expect(after.x).toBeCloseTo(s.x)
        expect(after.y).toBeCloseTo(s.y)
    })

    it('factor 1 leaves the view unchanged', () => {
        const at = { x: 300, y: 200 }
        const same = zoomAt(view, at, 1)
        expect(same.zoom).toBeCloseTo(view.zoom)
        expect(same.pan.x).toBeCloseTo(view.pan.x)
        expect(same.pan.y).toBeCloseTo(view.pan.y)
    })
})



describe('panBy', () => {

    it('shifts every projected point by (dx, dy) and leaves the input alone', () => {
        const before = makeCamera('iso', view).project(p)
        const moved = panBy(view, 15, -40)
        const after = makeCamera('iso', moved).project(p)
        expect(after.x).toBeCloseTo(before.x + 15)
        expect(after.y).toBeCloseTo(before.y - 40)
        expect(moved.zoom).toBe(view.zoom)
        expect(view.pan).toEqual({ x: 656, y: 48 })
    })
})