import { describe, it, expect } from 'vitest';
import { stormAt } from './storm';
import { DEFAULT_RULES } from '../types';
import { inCircle } from './geometry';

describe('stormAt', () => {
    it('has not started before startTurn', () => {
        expect(stormAt(0, DEFAULT_RULES)).toEqual({ radius: 10, damage: 0, phase: 0 })
    })

    it('shrinks by one and deals base damage at startTurn', () => {
        expect(stormAt(20, DEFAULT_RULES)).toEqual({ radius: 9, damage: 1, phase: 1 });
    })

    it('still phase 1 at turn 29', () => {
        expect(stormAt(29, DEFAULT_RULES)).toEqual({ radius: 9, damage: 1, phase: 1 });
    })

    it('phase 2 at turn 30', () => {
        expect(stormAt(30, DEFAULT_RULES)).toEqual({ radius: 8, damage: 2, phase: 2});
    })

    it('radius floors at -1 late game', () => {
        expect(stormAt(199, DEFAULT_RULES)).toEqual({ radius: -1, damage: 18, phase: 18});
    })
})

describe('isSafe', () => {
    it('center is always safe', () => {
        expect(inCircle({ x: 5, y: 5 }, { x: 5, y: 5 }, 0)).toBe(true);
    })
    it('corner is outside a small circle', () => {
        expect(inCircle({ x: 0, y: 0 }, { x: 5, y: 5 }, 3)).toBe(false);
    })
    it('edge of the circle is safe', () => {
        expect(inCircle({ x: 8, y: 5 }, { x: 5, y: 5 }, 3)).toBe(true);
    })

    it('nothing is safe once radius is negative', () => {
        expect(inCircle({ x: 5, y: 5 }, { x: 5, y: 5 }, -1)).toBe(false);
    })
})
