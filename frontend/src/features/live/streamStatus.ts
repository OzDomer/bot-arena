import type { ConnectionStatus } from './useLive'

export type StreamTone = 'live' | 'pending' | 'warn' | 'down'

// What the header says about the stream. Only a working connection reads
// as live; a reconnect is a warning, because what is on screen may be stale.
export function streamStatus(connection: ConnectionStatus): { tone: StreamTone; label: string } {
    switch (connection) {
        case 'connected': return { tone: 'live', label: 'live' }
        case 'connecting': return { tone: 'pending', label: 'connecting' }
        case 'reconnecting': return { tone: 'warn', label: 'reconnecting' }
        case 'disconnected': return { tone: 'down', label: 'offline' }
    }
}
