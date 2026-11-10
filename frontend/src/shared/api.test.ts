import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getLive, getMatch, streamUrl } from './api'

afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
})

describe('API', () => {
    it('uses the configured base for requests and the stream', async () => {
        vi.stubEnv('VITE_API_URL', '/api/')
        const live = { now: '2026-01-01T00:00:00.000Z', msPerTurn: 150, current: null, next: null }
        const match = { matchId: 7, phase: 'scheduled', opensAt: live.now }
        const fetch = vi.fn()
            .mockResolvedValueOnce(Response.json(live))
            .mockResolvedValueOnce(Response.json(match))
        vi.stubGlobal('fetch', fetch)

        expect(await getLive()).toEqual(live)
        expect(await getMatch(7)).toEqual(match)
        expect(fetch.mock.calls).toEqual([['/api/live'], ['/api/matches/7']])
        expect(streamUrl()).toBe('/api/stream')
    })

    it('preserves the HTTP status and server message', async () => {
        vi.stubEnv('VITE_API_URL', '/api')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'not found' }, { status: 404 })))

        const error = await getMatch(7).catch((error: unknown) => error)
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ status: 404, message: 'not found' })
    })
})
