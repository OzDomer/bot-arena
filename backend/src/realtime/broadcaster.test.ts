import type { Response } from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LiveSnapshot } from '../matches/snapshot.ts'
import {
    addClient,
    broadcast,
    clientCount,
    HEARTBEAT_INTERVAL_MS,
    removeClient,
    startHeartbeat,
} from './broadcaster.ts'

const snapshot: LiveSnapshot = {
    now: '2026-01-01T12:00:00.000Z',
    msPerTurn: 150,
    current: null,
    next: {
        matchId: 7,
        phase: 'scheduled',
        opensAt: '2026-01-01T12:01:00.000Z',
    },
}

const clients: Response[] = []
let stopHeartbeat: (() => void) | undefined

function addTestClient() {
    const write = vi.fn<(message: string) => boolean>().mockReturnValue(true)
    const response = { write } as unknown as Response
    clients.push(response)
    addClient(response)
    return { response, write }
}

afterEach(() => {
    stopHeartbeat?.()
    stopHeartbeat = undefined
    for (const client of clients) removeClient(client)
    clients.length = 0
    vi.useRealTimers()
})

describe('broadcast', () => {
    it('writes one correctly framed state event with a single JSON data line', () => {
        const client = addTestClient()

        broadcast(snapshot)

        expect(client.write).toHaveBeenCalledExactlyOnceWith(`event: state\ndata: ${JSON.stringify(snapshot)}\n\n`)
        const lines = client.write.mock.calls[0][0].split('\n')
        expect(lines).toEqual(['event: state', `data: ${JSON.stringify(snapshot)}`, '', ''])
        expect(JSON.parse(lines[1].slice('data: '.length))).toEqual(snapshot)
    })

    it('sends the same snapshot to both clients', () => {
        const first = addTestClient()
        const second = addTestClient()

        broadcast(snapshot)

        expect(clientCount()).toBe(2)
        expect(first.write).toHaveBeenCalledExactlyOnceWith(`event: state\ndata: ${JSON.stringify(snapshot)}\n\n`)
        expect(second.write).toHaveBeenCalledExactlyOnceWith(`event: state\ndata: ${JSON.stringify(snapshot)}\n\n`)
    })

    it('stops writing to a removed client', () => {
        const first = addTestClient()
        const second = addTestClient()
        broadcast(snapshot)

        removeClient(first.response)
        broadcast(snapshot)

        expect(clientCount()).toBe(1)
        expect(first.write).toHaveBeenCalledTimes(1)
        expect(second.write).toHaveBeenCalledTimes(2)
    })

    it('drops a client whose write throws and continues broadcasting to the others', () => {
        const broken = addTestClient()
        broken.write.mockImplementation(() => {
            throw new Error('connection closed')
        })
        const first = addTestClient()
        const second = addTestClient()

        expect(() => broadcast(snapshot)).not.toThrow()
        expect(clientCount()).toBe(2)
        broadcast(snapshot)

        expect(broken.write).toHaveBeenCalledTimes(1)
        expect(first.write).toHaveBeenCalledTimes(2)
        expect(second.write).toHaveBeenCalledTimes(2)
    })

    it('keeps a client whose write buffers the event', () => {
        const client = addTestClient()
        client.write.mockReturnValue(false)

        broadcast(snapshot)
        broadcast(snapshot)

        expect(clientCount()).toBe(1)
        expect(client.write).toHaveBeenCalledTimes(2)
    })
})

describe('heartbeat', () => {
    it('writes comment lines to each client at the interval and stops when requested', () => {
        vi.useFakeTimers()
        const first = addTestClient()
        const second = addTestClient()
        stopHeartbeat = startHeartbeat()

        vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS - 1)
        expect(first.write).not.toHaveBeenCalled()
        expect(second.write).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(first.write).toHaveBeenCalledExactlyOnceWith(': ping\n\n')
        expect(second.write).toHaveBeenCalledExactlyOnceWith(': ping\n\n')

        vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS)
        expect(first.write).toHaveBeenCalledTimes(2)
        expect(second.write).toHaveBeenCalledTimes(2)

        stopHeartbeat()
        vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2)
        expect(first.write).toHaveBeenCalledTimes(2)
        expect(second.write).toHaveBeenCalledTimes(2)
        expect(vi.getTimerCount()).toBe(0)
    })

    it('drops a failed client without interrupting heartbeats to another', () => {
        vi.useFakeTimers()
        const broken = addTestClient()
        broken.write.mockImplementation(() => {
            throw new Error('connection closed')
        })
        const healthy = addTestClient()
        stopHeartbeat = startHeartbeat()

        vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2)

        expect(clientCount()).toBe(1)
        expect(broken.write).toHaveBeenCalledTimes(1)
        expect(healthy.write).toHaveBeenCalledTimes(2)
        expect(healthy.write).toHaveBeenLastCalledWith(': ping\n\n')
    })
})
