import { clamp } from "../index"

export function shade(hex: string, factor: number): string {
    const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map(s => parseInt(s, 16))
    const scaled = channels.map(c => clamp(Math.round(c * factor), 0, 255))
    return toHex(scaled)
}

export function hslToHex(h: number, s: number, l: number): string {
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        const a = s * Math.min(l, 1 - l)
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    }
    const channels = [f(0), f(8), f(4)].map(v => Math.round(v * 255))
    return toHex(channels)
}


export function toHex(channels: number[]): string {
    return '#' + channels.map(m => m.toString(16).padStart(2, '0')).join('')

}