import type { MatchSnapshot } from '../../shared/api'

type Odds = Extract<MatchSnapshot, { phase: 'open' }>['odds']

export function formatProbability(probability: number): string {
    return `${(probability * 100).toFixed(1)}%`
}

export function sortedOdds(lineup: readonly string[], odds: Odds) {
    return lineup.map(name => ({ name, probability: odds.wins[name], label: formatProbability(odds.wins[name]) }))
        .sort((a, b) => b.probability - a.probability || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}
