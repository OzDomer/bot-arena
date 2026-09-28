import { clamp } from "../sim/geometry"

export function shade(hex: string, factor: number): string{
    const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map(s => parseInt(s, 16))
    const scaled = channels.map(c => clamp(Math.round(c * factor), 0, 255))
    return '#' + scaled.map(m => m.toString(16).padStart(2, '0')).join('')
}