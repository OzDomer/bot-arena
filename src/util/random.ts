
export type Rng = () => number;   // 0 ≤ n < 1, like Math.random

export function makeRng(seed: number): Rng {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6D2B79F5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
export function pickRandom<T>(arr: T[], rng: Rng): T {
    return arr[Math.floor(rng() * arr.length)]
}


export function shuffle<T>(arr: T[], rng: Rng): T[] {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]]
    }
    return out
}