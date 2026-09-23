import type { World, Entrant } from './types';
import { RandomBot } from './bots/RandomBot';
import { runMatch } from './sim/match';
import { ChaserFSM } from './bots/ChaserFSM';
import { TILE } from './render/render';
import { Player } from './render/Player';
import { CowardFSM } from './bots/CowardFSM';
import { makeRng } from './util/random';
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

console.log(`Match seed: ${seed}`);
const rng = makeRng(seed);
const entrants: Entrant[] =
  [
    { name: 'random', make: rng => new RandomBot(rng) },
    { name: 'chaser', make: rng => new ChaserFSM(rng) },
  ]

const { world, brains } = makeMatch(entrants, rng)

const history: World[] = [world];


const final = runMatch(world, brains, w => {
  history.push(w)
})
console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));

canvas.width = world.width * TILE
canvas.height = world.height * TILE



console.table(runTournament(entrants, 100, seed))

const player = new Player(ctx, history, turnCounter);
document.getElementById('play')!.onclick = () => player.play();
document.getElementById('pause')!.onclick = () => player.pause();
document.getElementById('stepBack')!.onclick = () => player.stepBack();
document.getElementById('stepForward')!.onclick = () => player.stepForward();


