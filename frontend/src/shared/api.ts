type BettingSnapshot = {
    matchId: number
    opensAt: string
    closesAt: string
    lineup: string[]
    preset: string
    simVersion: string
    odds: {
        wins: Record<string, number>
        draw: number
        timeout: number
    }
    commitHash: string
}

type PlaybackSnapshot = BettingSnapshot & {
    secret: string
    startsAt: string
    turns: number
}

export type MatchSnapshot =
    | { matchId: number; phase: 'scheduled'; opensAt: string }
    | (BettingSnapshot & { phase: 'open' })
    | (BettingSnapshot & { phase: 'closed' })
    | (PlaybackSnapshot & { phase: 'revealed' })
    | (PlaybackSnapshot & { phase: 'settled'; winner: string; settledAt: string })

export type LiveSnapshot = {
    now: string
    msPerTurn: number
    current: MatchSnapshot | null
    next: MatchSnapshot | null
}

export class ApiError extends Error {
    readonly status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

function apiUrl(path: string): string {
    return `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}${path}`
}

async function get<T>(path: string): Promise<T> {
    const response = await fetch(apiUrl(path))
    if (!response.ok) {
        const error: { message: string } = await response.json()
        throw new ApiError(response.status, error.message)
    }
    return response.json() as Promise<T>
}

export function getLive(): Promise<LiveSnapshot> {
    return get('/live')
}

export function getMatch(id: number): Promise<MatchSnapshot> {
    return get(`/matches/${id}`)
}

export function streamUrl(): string {
    return apiUrl('/stream')
}
