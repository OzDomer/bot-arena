// The last stretch of a countdown is shown in the accent colour.
const URGENT_MS = 10_000

export function isUrgent(remainingMs: number): boolean {
    return remainingMs > 0 && remainingMs <= URGENT_MS
}

// What the stage shows between the reveal and the first frame: nothing once
// playback has started, a 3-2-1 for the last three seconds, and a plain
// "get ready" before that.
export type StartCue = 1 | 2 | 3 | 'ready' | null

export function startCue(msUntilStart: number): StartCue {
    if (!(msUntilStart > 0)) return null
    const seconds = Math.ceil(msUntilStart / 1000)
    return seconds === 1 || seconds === 2 || seconds === 3 ? seconds : 'ready'
}

// How far through the match the shown frame is, 0 to 1.
export function turnProgress(turn: number, lastTurn: number): number {
    if (!(lastTurn > 0)) return 0
    return Math.max(0, Math.min(1, turn / lastTurn))
}

// A commitment is 64 hex characters; the ends are enough to recognise one.
export function shortHash(hash: string): string {
    return hash.length <= 20 ? hash : `${hash.slice(0, 8)}…${hash.slice(-8)}`
}
