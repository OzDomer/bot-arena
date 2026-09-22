import { DELTAS, type Direction, type Position } from "../types";

export function manhattan(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

export function directionToward(from: Position, to: Position): Direction {
    const dx = Math.sign(to.x - from.x);   // -1, 0, or 1
    const dy = Math.sign(to.y - from.y);
    const entry = Object.entries(DELTAS).find(([, d]) => d.dx === dx && d.dy === dy);
    return entry![0] as Direction;
}