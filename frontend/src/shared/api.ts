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

export type User = {
    id: number
    name: string
    credits: number
    createdAt: string
}

export type AuthResult = { token: string; user: User }

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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = options ? await fetch(apiUrl(path), options) : await fetch(apiUrl(path))
    if (response.status === 204) return undefined as T

    let data: unknown
    try {
        data = await response.json()
    } catch {
        throw new ApiError(response.status, 'Could not read the server response')
    }

    if (!response.ok) {
        const message = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
            ? data.message : 'Request failed'
        throw new ApiError(response.status, message)
    }
    return data as T
}

export function getLive(): Promise<LiveSnapshot> {
    return request('/live')
}

export function getMatch(id: number): Promise<MatchSnapshot> {
    return request(`/matches/${id}`)
}

export function register(name: string, password: string): Promise<AuthResult> {
    return request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
    })
}

export function login(name: string, password: string): Promise<AuthResult> {
    return request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
    })
}

export function getMe(token: string): Promise<User> {
    return request('/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
    })
}

export function renameMe(token: string, name: string): Promise<User> {
    return request('/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name })
    })
}

export function deleteMe(token: string): Promise<void> {
    return request('/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    })
}

export function streamUrl(): string {
    return apiUrl('/stream')
}
