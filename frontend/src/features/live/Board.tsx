import type { CSSProperties } from 'react'
import type { MatchSnapshot } from '../../shared/api'
import type { SeatState } from '../arena/frameReport'
import { boardRows, type BoardRow } from './boardRows'
import { formatProbability } from './odds'

type BoardMatch = Exclude<MatchSnapshot, { phase: 'scheduled' }>

const STAMP: Record<BoardMatch['phase'], string> = {
    open: 'open',
    closed: 'bets closed',
    revealed: 'playing',
    settled: 'final',
}

function Row({ row, index }: { row: BoardRow; index: number }) {
    const style = { '--share': row.share, '--seat': row.color ?? 'transparent', '--i': index } as CSSProperties
    const hpShare = row.hp !== null && row.maxHp ? row.hp / row.maxHp : 0

    return (
        <li className="board-row" data-state={row.state} style={style}>
            <span className="board-chip" aria-hidden="true" />
            <span className="board-name">{row.name}</span>
            {row.state === 'sunk' && <span className="board-tag">sunk</span>}
            {row.state === 'winner' && <span className="board-tag">winner</span>}
            {row.state === 'afloat' && row.hp !== null && (
                <span className="board-hp" role="img" aria-label={`${row.hp} of ${row.maxHp} hp`}>
                    <span style={{ width: `${hpShare * 100}%` }} />
                </span>
            )}
            <span className="board-odds">{row.label}</span>
            <span className="board-bar" aria-hidden="true" />
        </li>
    )
}

function Skeleton() {
    return (
        <ul className="board-rows board-skeleton" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
                <li key={index} className="board-row" style={{ '--i': index } as CSSProperties}><span /><span /></li>
            ))}
        </ul>
    )
}

type BoardProps = {
    match: MatchSnapshot | null
    seats: readonly SeatState[] | null
    // true until the first snapshot arrives
    loading: boolean
}

export default function Board({ match, seats, loading }: BoardProps) {
    const shown = match && match.phase !== 'scheduled' ? match : null

    return (
        <aside className="board" data-phase={shown?.phase ?? 'none'} aria-label="Lineup and odds">
            <div className="board-head">
                <h2>Board</h2>
                {shown && <span className="board-stamp" key={shown.phase}>{STAMP[shown.phase]}</span>}
            </div>
            {shown && (
                <>
                    <ul className="board-rows" key={shown.matchId}>
                        {boardRows(shown.lineup, shown.odds, seats, shown.phase === 'settled' ? shown.winner : null)
                            .map((row, index) => <Row key={row.name} row={row} index={index} />)}
                    </ul>
                    <p className="board-foot">
                        <span>draw {formatProbability(shown.odds.draw)}</span>
                        <span>timeout {formatProbability(shown.odds.timeout)}</span>
                    </p>
                    {(shown.phase === 'open' || shown.phase === 'closed') && (
                        <p className="board-note prose">
                            Win chances come from simulated matches of this exact lineup. Each entrant's ship and colour are drawn from the sealed secret, so they appear at the reveal.
                        </p>
                    )}
                </>
            )}
            {!shown && loading && <Skeleton />}
            {!shown && !loading && <p className="board-note prose">The lineup and its odds appear when the next match opens.</p>}
        </aside>
    )
}
