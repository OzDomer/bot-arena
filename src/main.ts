import type { World, Ship, Action } from './types';
import { observe } from './sim/observe';
import { step } from './sim/step';

const ships: Ship[] = [
  { id: 1, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 5, y: 5 } },
  { id: 2, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 6, y: 5 } }, // 3 away
  { id: 3, hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position: { x: 0, y: 0 } }, // far
];

const world: World = { turn: 0, turnCap: 200, width: 10, height: 10, ships };

console.log(observe(world, ships[0]));

const actions: Record<Ship['id'], Action> = {
  1: { move: 'E', attack: 2 },
  2: { move: 'STAY', attack: 1 },
};

console.log(step(world, actions));