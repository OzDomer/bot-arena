import { describe, it, expect } from 'vitest';
import { step } from './step';
import type { Ship, World } from '../types';

function ship(over: Partial<Ship> & { id: number }): Ship {
    return {
        hp: 10, maxHp: 10, attackDamage: 2, visionRange: 3, attackRange: 1,
        position: { x: 0, y: 0 }, facing: 'N', ...over
    };
}

function world(ships: Ship[]): World {
    return { turn: 0, turnCap: 200, width: 10, height: 10, ships };
}

describe('step', () => {
    it('resolves attacks simultaneously', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'W' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY', attack: 1 } });
        expect(next.ships[0].hp).toBe(8);
        expect(next.ships[1].hp).toBe(8);
    })
    it('doubles damage from the rear', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(10);
        expect(next.ships[1].hp).toBe(6);
    })
    it('out of range attack does nothing', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 7 }, facing: 'W' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(10);
        expect(next.ships[1].hp).toBe(10);
    })
    it('dead ship cant attack', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W', hp: 0 }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(0);
        expect(next.ships[1].hp).toBe(10);
    })
    it('movement clamps at the edge', () => {
        const w = world([
            ship({ id: 1, position: { x: 0, y: 5 }, facing: 'W' }),
        ])
        const next = step(w, { 1: { move: 'W' } })
        expect(next.ships[0].position).toEqual({ x: 0, y: 5 });
    })
    it('wreck blocks a tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W', hp: 0 }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 2: { move: 'W' } })
        expect(next.ships[1].position).toEqual({ x: 6, y: 5 })
        expect(next.ships[1].facing).toBe('W')
    })
    it('lower id gets tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'NE' }, 2: { move: 'N' } })
        expect(next.ships[0].position).toEqual({ x: 6, y: 4 })
        expect(next.ships[1].position).toEqual({ x: 6, y: 5 })
    })
    it('increments turn without mutating input', () => {
        const w = world([])
        const next = step(w, {})
        expect(next.turn).toBe(1)
        expect(w.turn).toBe(0)
    })
})
