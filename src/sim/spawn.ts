import { FACING, type Position, type Rules, type Ship } from "../types";
import { pickRandom, type Rng } from "../util/random";

export function randomPositions(count: number, width: Rules['width'], height: Rules['height'], rng: Rng): Position[] {
    const positions: Position[] = []
    while (positions.length < count) {
        const x = Math.floor(rng() * width);
        const y = Math.floor(rng() * height);
        const taken = positions.some(p => p.x === x && p.y === y);
        if (!taken) positions.push({ x, y });
    }
    return positions
}

export function makeShips(positions: Position[], rules: Rules, rng: Rng): Ship[] {
    const { hp, attackDamage, visionRange, attackRange } = rules.ship;
    return positions.map((position, i) => ({
        id: i + 1, hp, maxHp: hp, attackDamage, visionRange, attackRange,
        position, facing: pickRandom(FACING, rng),
    }));
}