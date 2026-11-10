import type { Response } from 'express'
import type { LiveSnapshot } from '../matches/snapshot.ts'

export const HEARTBEAT_INTERVAL_MS = 25_000

const clients = new Set<Response>()

export function addClient(client: Response): void {
    clients.add(client)
}

export function removeClient(client: Response): void {
    clients.delete(client)
}

export function clientCount(): number {
    return clients.size
}

function writeToClients(message: string): void {
    for (const client of clients) {
        try {
            client.write(message)
        } catch {
            clients.delete(client)
        }
    }
}

export function broadcast(snapshot: LiveSnapshot): void {
    writeToClients(`event: state\ndata: ${JSON.stringify(snapshot)}\n\n`)
}

export function startHeartbeat(): () => void {
    const timer = setInterval(() => writeToClients(': ping\n\n'), HEARTBEAT_INTERVAL_MS)
    timer.unref()
    return () => clearInterval(timer)
}
