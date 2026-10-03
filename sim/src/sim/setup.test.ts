import { describe, it, expect } from 'vitest';
import { makeMatch } from './setup';
import { DEFAULT_RULES } from '../types';

describe('makeMatch', () => {
  it('uses the rules it was given', () => {
    const custom = { ...DEFAULT_RULES, width: 20 }
    const { world } = makeMatch([], 1, custom)
    expect(world.rules).toBe(custom)
  })
})