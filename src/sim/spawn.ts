import { FACING , type Position, type Ship, type World } from "../types";
import { pickRandom, type Rng } from "../util/random";

export function randomPositions(count: number, width: World['width'], height: World['height'], rng: Rng): Position[] {
    const positions: Position[] = []
    while (positions.length < count) {
        const x = Math.floor(rng() * width);
        const y = Math.floor(rng() * height);
        const taken = positions.some(p => p.x === x && p.y === y);
        if (!taken) positions.push({ x, y });
    }
    return positions
}

export function makeShips(positions: Position[], rng: Rng): Ship[] {
    return positions.map((position, i) => ({ id: i + 1, hp: 10, maxHp: 10, attackDamage: 2, visionRange: 3, attackRange: 1, position, facing: pickRandom(FACING, rng) }))
}