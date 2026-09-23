import { DELTAS, type Arc, type Direction, type Facing, type Position, type Rules, type Ship, type VisibleShip } from "../types";

export function chebyshev(a: Position, b: Position): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
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

export function directionAway(from: Position, threat: Position): Direction {
    return directionToward(threat, from);
}

export function closestTo(from: Position, ships: VisibleShip[]): VisibleShip | undefined {
    return [...ships].sort((a, b) => chebyshev(from, a.position) - chebyshev(from, b.position))[0];
}

export function key(p: Position): string {
    return `${p.x},${p.y}`;
}

export function attackArc(target: Ship, attackerPos: Position): Arc {
    const toAttacker = { dx: Math.sign(attackerPos.x - target.position.x), dy: Math.sign(attackerPos.y - target.position.y) }
    const facing = DELTAS[target.facing]
    if (toAttacker.dx === facing.dx && toAttacker.dy === facing.dy) return 'front'
    if (toAttacker.dx === -facing.dx && toAttacker.dy === -facing.dy) return 'rear'
    return 'side'
}

export function mapCenter(rules: Rules): Position {
    return { x: Math.floor(rules.width / 2), y: Math.floor(rules.height / 2) };
}