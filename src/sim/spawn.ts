import type { Position, World } from "../types";
import { type Rng } from "../util/random";

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