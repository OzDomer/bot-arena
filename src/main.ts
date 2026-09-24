import type { World } from './types';
import { runMatch } from './sim/match';
import { TILE } from './render/render';
import { Player } from './render/Player';
import { runTournament } from './sim/tournament';
import { makeMatch } from './sim/setup';
import { entrants } from './bots';


const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')
if (!canvas) throw new Error('no canvas')

const turnCounter = document.getElementById("turnCounter")
if (!turnCounter) throw new Error('turnCounter')

const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('no 2d context')

const seed = Date.now();
// const seed = 1790266907455;


console.log(`Match seed: ${seed}`);


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


