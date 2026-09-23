import { describe, it, expect } from 'vitest';
import { stormAt, isSafe } from './storm';
import { DEFAULT_RULES } from '../types';

describe('stormAt', () => {
    it('has not started before startTurn', () => {
        expect(stormAt(0, DEFAULT_RULES)).toEqual({ radius: 10, damage: 0 })
    })

    it('shrinks by one and deals base damage at startTurn', () => {
        expect(stormAt(20, DEFAULT_RULES)).toEqual({ radius: 9, damage: 1 });
    })

    it('still phase 1 at turn 29', () => {
        expect(stormAt(29, DEFAULT_RULES)).toEqual({ radius: 9, damage: 1 });
    })

    it('phase 2 at turn 30', () => {
        expect(stormAt(30, DEFAULT_RULES)).toEqual({ radius: 8, damage: 2 });
    })

    it('radius floors at 0 late game', () => {
        expect(stormAt(199, DEFAULT_RULES)).toEqual({ radius: 0, damage: 18 });
    })
})

describe('isSafe', () => {
    it('center is always safe', () => {
        expect(isSafe({ x: 5, y: 5 }, { x: 5, y: 5 }, 0)).toBe(true);
    })
    it('corner is outside a small circle', () => {
        expect(isSafe({ x: 0, y: 0 }, { x: 5, y: 5 }, 3)).toBe(false);
    })
    it('edge of the circle is safe', () => {
        expect(isSafe({ x: 8, y: 5 }, { x: 5, y: 5 }, 3)).toBe(true);
    })
})
