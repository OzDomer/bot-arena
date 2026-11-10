import { describe, expect, it } from 'vitest'
import { streamStatus } from './streamStatus'

describe('streamStatus', () => {
    it.each([
        ['connected', 'live', 'live'],
        ['connecting', 'pending', 'connecting'],
        ['reconnecting', 'warn', 'reconnecting'],
        ['disconnected', 'down', 'offline'],
    ] as const)('%s reads as %s with the word %s', (connection, tone, label) => {
        expect(streamStatus(connection)).toEqual({ tone, label })
    })

    it('calls nothing but a working connection live', () => {
        const live = (['connecting', 'connected', 'reconnecting', 'disconnected'] as const)
            .filter(connection => streamStatus(connection).tone === 'live')
        expect(live).toEqual(['connected'])
    })
})
