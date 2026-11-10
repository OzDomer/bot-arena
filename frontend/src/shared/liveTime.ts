export type LivePlayback = {
    startsAt: number
    msPerTurn: number
    now: () => number
    settled: boolean
}

export function remainingMs(deadline: number, clientNow: number, offset = 0): number {
    return Math.max(0, deadline - (clientNow + offset))
}

export function frameForTime(startsAt: number, msPerTurn: number, lastFrame: number, clientNow: number, offset = 0): number {
    const frame = Math.floor((clientNow + offset - startsAt) / msPerTurn)
    return Math.max(0, Math.min(lastFrame, frame))
}
