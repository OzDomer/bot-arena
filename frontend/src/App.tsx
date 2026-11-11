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
            <header className="site-header">
                <a className="wordmark" href={location.pathname} title="To the live arena">bot<span aria-hidden="true">/</span>arena</a>
                <p className="replay-label"><span className="replay-word">replay</span>seed {params.seed} · {params.preset}</p>
                <button className="btn" title="Copy the link to this match" onClick={() => { navigator.clipboard.writeText(location.href) }}>copy link</button>
            </header>
            <Arena match={match} />
        </>
    )
}

export default function App() {
    return new URLSearchParams(location.search).has('seed') ? <ReplayPage /> : <LivePage />
}
