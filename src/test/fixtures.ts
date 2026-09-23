import type { Ship, World } from "../types";

export function ship(over: Partial<Ship> & { id: number }): Ship {
    return {
        hp: 10, maxHp: 10, attackDamage: 2, visionRange: 3, attackRange: 1,
        position: { x: 0, y: 0 }, facing: 'N', ...over
    };
}

export function world(ships: Ship[]): World {
    return { turn: 0, turnCap: 200, width: 10, height: 10, ships };
}
