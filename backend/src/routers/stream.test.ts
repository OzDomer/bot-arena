import { once } from 'node:events'
import type { Server } from 'node:http'
import type { ReadableStreamDefaultReader } from 'node:stream/web'
import { afterEach, describe, expect, it, vi } from 'vitest'
import app from '../app.ts'
import type { LiveSnapshot } from '../matches/snapshot.ts'
import { broadcast, clientCount } from '../realtime/broadcaster.ts'

let server: Server | undefined
let controller: AbortController | undefined

async function readEvent(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
    const decoder = new TextDecoder()
    let event = ''
    while (!event.includes('\n\n')) {
        const { done, value } = await reader.read()
        if (done) throw new Error('stream ended before an event arrived')
        event += decoder.decode(value, { stream: true })
    }
    return event
}

afterEach(async () => {
    controller?.abort()
    controller = undefined
    const currentServer = server
    server = undefined
    if (currentServer?.listening) {
        await new Promise<void>((resolve, reject) => {
            currentServer.close((error) => error ? reject(error) : resolve())
            currentServer.closeAllConnections()
        })
    }
})

describe('GET /stream', () => {
    it('sends the initial snapshot, broadcasts on the same connection and removes disconnected clients', async () => {
        expect(clientCount()).toBe(0)
        server = app.listen(0)
        await once(server, 'listening')
        const address = server.address()
        if (!address || typeof address === 'string') throw new Error('expected a TCP listener')
        const host = address.family === 'IPv6' ? `[${address.address}]` : address.address
        controller = new AbortController()

        const response = await fetch(`http://${host}:${address.port}/stream`, { signal: controller.signal })

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toBe('text/event-stream')
        expect(response.headers.get('cache-control')).toBe('no-cache')
        expect(response.headers.get('connection')).toBe('keep-alive')
        expect(response.headers.get('x-accel-buffering')).toBe('no')
        expect(clientCount()).toBe(1)
        if (!response.body) throw new Error('expected a streaming response body')
        const reader = response.body.getReader()

        const initial = await readEvent(reader)
        const lines = initial.split('\n')
        expect(lines).toEqual(['event: state', expect.stringMatching(/^data: /), '', ''])
        const snapshot: LiveSnapshot = JSON.parse(lines[1].slice('data: '.length))
        expect(snapshot).toEqual({
            now: expect.any(String),
            msPerTurn: 150,
            current: null,
            next: null,
        })
        expect(Number.isNaN(Date.parse(snapshot.now))).toBe(false)

        const updated: LiveSnapshot = {
            now: '2026-01-01T12:00:00.000Z',
            msPerTurn: 150,
            current: null,
            next: { matchId: 7, phase: 'scheduled', opensAt: '2026-01-01T12:01:00.000Z' },
        }
        broadcast(updated)

        expect(await readEvent(reader)).toBe(`event: state\ndata: ${JSON.stringify(updated)}\n\n`)

        controller.abort()
        await vi.waitFor(() => expect(clientCount()).toBe(0), { interval: 1, timeout: 1000 })
    })
})
