import { entrants } from './bots'
import { runTournament } from './sim/tournament'

const matches = Number(process.argv[2] ?? 1000)   // default match count
const seed = Number(process.argv[3] ?? 1111)      // default seed — pick a fixed one, not Date.now()

console.log(`matches: ${matches}  seed: ${seed}`)
const { tally, totals } = runTournament(entrants, matches, seed)
console.table(tally)
console.table(totals)