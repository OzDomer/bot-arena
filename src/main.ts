import type { World, Ship } from './types';
import { observe } from './sim/observe';

const ships: Ship[] = [
  { id: 1, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 5, y: 5 } },
  { id: 2, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 7, y: 7 } }, // 3 away
  { id: 3, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 0, y: 0 } }, // far
];

const world: World = { turn: 0, turnCap: 200, width: 10, height: 10, ships };

console.log(observe(world, ships[0]));