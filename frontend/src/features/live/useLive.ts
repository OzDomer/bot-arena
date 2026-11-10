import { useEffect, useState } from 'react'
import { getLive, streamUrl, type LiveSnapshot } from '../../shared/api'
import { newerSnapshot } from './liveSnapshot'

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export function useLive() {
    const [live, setLive] = useState<{ snapshot: LiveSnapshot | null; offset: number }>({ snapshot: null, offset: 0 })
    const [connection, setConnection] = useState<ConnectionStatus>('connecting')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        let received = false
        const receive = (snapshot: LiveSnapshot) => {
            if (!active) return
            received = true
            const offset = Date.parse(snapshot.now) - Date.now()
            setLive(current => newerSnapshot(current.snapshot, snapshot) === snapshot ? { snapshot, offset } : current)
            setError(null)
        }

        void getLive().then(receive).catch((error: unknown) => {
            if (active && !received) setError(error instanceof Error ? error.message : 'Could not load the live match')
        })

        const stream = new EventSource(streamUrl())
        const onState = (event: MessageEvent<string>) => {
            try {
                receive(JSON.parse(event.data) as LiveSnapshot)
            } catch {
                if (active) setError('Could not read the live stream')
            }
        }
        stream.addEventListener('state', onState)
        stream.onopen = () => {
            if (active) setConnection('connected')
        }
        stream.onerror = () => {
            if (active) setConnection(stream.readyState === EventSource.CLOSED ? 'disconnected' : 'reconnecting')
        }

        return () => {
            active = false
            stream.removeEventListener('state', onState)
            stream.close()
        }
    }, [])

    return { ...live, connection, error }
}
