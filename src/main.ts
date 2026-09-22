import type { World, Ship, Brain } from './types';
import { RandomBot } from './bots/RandomBot';
import { runMatch } from './sim/match';
import { ChaserFSM } from './bots/ChaserFSM';
import { drawWorld, TILE } from './render/render';


const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas');
if (!canvas) throw new Error('no canvas');

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('no 2d context');




const ships: Ship[] = [
  { id: 1, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 5, y: 5 } },
  { id: 2, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 9, y: 9 } },
  { id: 3, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 0, y: 0 } },
];

const world: World = { turn: 0, turnCap: 200, width: 10, height: 10, ships };
const brains: Record<Ship['id'], Brain> = {
  1: new RandomBot(),
  2: new ChaserFSM(),
  3: new ChaserFSM(),
};

const final = runMatch(world, brains, w => {
  if (w.turn % 10 === 0) {
    console.table(w.ships.map(s => ({ id: s.id, hp: s.hp, x: s.position.x, y: s.position.y })))
  }
})
console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));

canvas.width = world.width * TILE
canvas.height = world.height * TILE

drawWorld(ctx, world)