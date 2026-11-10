import { useState, useEffect } from 'react'
import Arena from './features/arena/Arena'
import { type MatchParams, parseMatchParams } from './features/arena/matchParams'
import { useMatch } from './features/arena/useMatch'
import LivePage from './features/live/LivePage'

function ReplayPage() {
    const [params] = useState<MatchParams>(
        () => parseMatchParams(location.search) ?? { seed: crypto.getRandomValues(new Uint32Array(1))[0], preset: 'bigmap' }
    )
    const match = useMatch(params.seed, params.preset)

    useEffect(() => {
        window.history.replaceState(null, '', `?seed=${params.seed}&preset=${params.preset}`)
    }, [params])

    return (
        <>
            <button onClick={() => { navigator.clipboard.writeText(location.href) }}>copy match link</button>
            <Arena match={match} />
        </>
    )
}

export default function App() {
    return new URLSearchParams(location.search).has('seed') ? <ReplayPage /> : <LivePage />
}
