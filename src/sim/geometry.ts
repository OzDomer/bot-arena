import type { Position } from "../types";

export function manhattan(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}