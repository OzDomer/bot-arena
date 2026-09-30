import { describe, expect, it } from "vitest"
import { hslToHex, shade } from "./color"

describe('shade', () => {
    it('factor 1 leaves the color unchanged', () => {
        expect(shade('#457b9d', 1)).toBe('#457b9d')

    })
    it('factor 0 is black', () => {
        expect(shade('#ffffff', 0)).toBe('#000000')

    })

    it('factor 0.5 halves each channel, rounding', () => {
        expect(shade('#ff0000', 0.5)).toBe('#800000')

    })

    it('clamps at 255 when brightening', () => {
        expect(shade('#ffffff', 2)).toBe('#ffffff')

    })
})


it('primaries land on the hue axes', () => {
    expect(hslToHex(0, 1, 0.5)).toBe('#ff0000')
    expect(hslToHex(120, 1, 0.5)).toBe('#00ff00')
    expect(hslToHex(240, 1, 0.5)).toBe('#0000ff')
})

it('lightness extremes are white and black regardless of hue', () => {
    expect(hslToHex(0, 0, 1)).toBe('#ffffff')
    expect(hslToHex(0, 0, 0)).toBe('#000000')
})
