import type { LiveSnapshot, MatchSnapshot } from '../../shared/api'

const phaseOrder: Record<MatchSnapshot['phase'], number> = {
    scheduled: 0,
    open: 1,
    closed: 2,
    revealed: 3,
    settled: 4,
}

export function newerSnapshot(current: LiveSnapshot | null, incoming: LiveSnapshot): LiveSnapshot {
    if (!current) return incoming
    const timeDifference = Date.parse(incoming.now) - Date.parse(current.now)
    if (timeDifference !== 0) return timeDifference > 0 ? incoming : current

    // Multiple phase changes can share a server millisecond.
    const matchDifference = (incoming.current?.matchId ?? -1) - (current.current?.matchId ?? -1)
    if (matchDifference !== 0) return matchDifference > 0 ? incoming : current
    const phaseDifference = (incoming.current ? phaseOrder[incoming.current.phase] : -1)
        - (current.current ? phaseOrder[current.current.phase] : -1)
    if (phaseDifference !== 0) return phaseDifference > 0 ? incoming : current
    const nextDifference = (incoming.next?.matchId ?? -1) - (current.next?.matchId ?? -1)
    return nextDifference > 0 ? incoming : current
}
