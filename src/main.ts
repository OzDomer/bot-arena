import type { World, Ship, Brain } from './types';
import { RandomBot } from './bots/RandomBot';
import { runMatch } from './sim/match';
import { ChaserFSM } from './bots/ChaserFSM';
import { TILE } from './render/render';
import { Player } from './render/Player';
import { CowardFSM } from './bots/CowardFSM';


const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')
if (!canvas) throw new Error('no canvas')

const turnCounter = document.getElementById("turnCounter")
if (!turnCounter) throw new Error('turnCounter')

const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('no 2d context')


const ships: Ship[] = [
  { id: 1, hp: 10, maxHp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 5, y: 5 } },
  { id: 2, hp: 10, maxHp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 9, y: 9 } },
  { id: 3, hp: 10, maxHp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 0, y: 0 } },
];

const world: World = { turn: 0, turnCap: 200, width: 10, height: 10, ships };
const brains: Record<Ship['id'], Brain> = {
  1: new CowardFSM(),
  2: new ChaserFSM(),
  3: new ChaserFSM(),
};

const history: World[] = [world];


const final = runMatch(world, brains, w => {
  history.push(w)
})
console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));

canvas.width = world.width * TILE
canvas.height = world.height * TILE


const player = new Player(ctx, history, turnCounter);
document.getElementById('play')!.onclick = () => player.play();
document.getElementById('pause')!.onclick = () => player.pause();
document.getElementById('stepBack')!.onclick = () => player.stepBack();
document.getElementById('stepForward')!.onclick = () => player.stepForward();


