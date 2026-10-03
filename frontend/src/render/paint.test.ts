import { describe, expect, it } from "vitest"
import { signedArea } from "./paint"
import { type Vec2, type Vec3 } from "./camera"
import { testCamera } from "./fixtures"

describe('signedArea', () => {
    it('floor order positive', () => {
        const square: Vec2[] = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 }
        ]
        expect(signedArea(square)).toBe(1)

    })
    it('reversed order is negative', () => {
        const square: Vec2[] = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 0 }
        ]
        expect(signedArea(square)).toBe(-1)

    })

    it('side face is flat in top', () => {
        const cam = testCamera('top')
        const face: Vec3[] = [
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 1, z: 1 },
            { x: 1, y: 0, z: 1 }
        ]
        const screen = face.map(p => cam.project(p))
        expect(signedArea(screen)).toBeCloseTo(0)

    })

    it('floor tile is front-facing in both modes', () => {
        const isoCam = testCamera('iso')
        const topCam = testCamera('top')
        const tile: Vec3[] = [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 0, y: 1, z: 0 }
        ]
        const topScreen = tile.map(p => topCam.project(p))
        const isoScreen = tile.map(p => isoCam.project(p))
        expect(signedArea(topScreen)).toBeGreaterThan(0)
        expect(signedArea(isoScreen)).toBeGreaterThan(0)

    })
})