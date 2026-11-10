import type { CSSProperties } from 'react'
import type { ResultSummary } from './resultSummary'

export type Result = ResultSummary & {
    matchId: number
    // the winner's ship colour, once the replay has reported it
    color: string | null
    mismatch: string | null
}

type ResultBandProps = {
    result: Result
    // the band slides out when the next match opens
    leaving: boolean
    next: string | null
}

// Across the lower third of the stage, so the final frame stays visible.
export default function ResultBand({ result, leaving, next }: ResultBandProps) {
    const style = { '--seat': result.color ?? 'var(--accent)' } as CSSProperties

    return (
        <div
            className="result-band"
            data-kind={result.mismatch ? 'mismatch' : result.kind}
            data-leaving={leaving || undefined}
            style={style}
            role="status"
        >
            <span className="result-chip" aria-hidden="true" />
            <div className="result-main">
                <p className="result-label">{result.label} · match #{result.matchId}</p>
                <p className="result-headline">{result.headline}</p>
                <p className="result-detail">{result.detail}</p>
                {result.mismatch && <p className="result-mismatch prose" role="alert">{result.mismatch}</p>}
            </div>
            {next && !leaving && (
                <p className="result-next">
                    <span>next match in</span>
                    <strong>{next}</strong>
                </p>
            )}
        </div>
    )
}
