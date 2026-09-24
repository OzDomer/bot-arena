import type { World, Entrant } from './types';
import { RandomBot } from './bots/RandomBot';
import { runMatch } from './sim/match';
import { ChaserFSM } from './bots/ChaserFSM';
import { TILE } from './render/render';
import { Player } from './render/Player';
import { CowardFSM } from './bots/CowardFSM';
import { runTournament } from './sim/tournament';
import { makeMatch } from './sim/setup';


const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')
if (!canvas) throw new Error('no canvas')

const turnCounter = document.getElementById("turnCounter")
if (!turnCounter) throw new Error('turnCounter')

const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('no 2d context')

const seed = Date.now();
// const seed = 11111;

const BOTS = { random: RandomBot, chaser: ChaserFSM, coward: CowardFSM };

console.log(`Match seed: ${seed}`);
const entrants: Entrant[] =
  [
    { name: 'coward', make: rng => new BOTS.coward(rng) },
    { name: 'chaser', make: rng => new BOTS.chaser(rng) },
    { name: 'coward', make: rng => new BOTS.coward(rng) },
    { name: 'chaser', make: rng => new BOTS.chaser(rng) },
    { name: 'chaser', make: rng => new BOTS.chaser(rng) },
    { name: 'coward', make: rng => new BOTS.coward(rng) },
    { name: 'coward', make: rng => new BOTS.coward(rng) }
  ]

const { world, brains } = makeMatch(entrants, seed)

const history: World[] = [world];


const final = runMatch(world, brains, w => {
  history.push(w)
})
console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));

canvas.width = world.rules.width * TILE
canvas.height = world.rules.height * TILE



const result = (runTournament(entrants, 1000, seed))
console.table(result.tally)
console.table(result.totals)


const player = new Player(ctx, history, turnCounter);
document.getElementById('play')!.onclick = () => player.play();
document.getElementById('pause')!.onclick = () => player.pause();
document.getElementById('stepBack')!.onclick = () => player.stepBack();
document.getElementById('stepForward')!.onclick = () => player.stepForward();


