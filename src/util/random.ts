
export type Rng = () => number;   // 0 ≤ n < 1, like Math.random

export function makeRng(seed: number): Rng {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function pickRandom<T>(arr: T[], rng: Rng): T {
    return arr[Math.floor(rng() * arr.length)];
}