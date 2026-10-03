import type { Rules } from '../types';

export function stormAt(turn: number, rules: Rules) {
    const { startTurn, shrinkEvery, baseDamage } = rules.storm;
    const startRadius = Math.max(rules.width, rules.height);   // big enough to cover the whole map
    
    if (turn < startTurn) return { radius: startRadius, damage: 0, phase: 0 }

    const phase = Math.floor((turn - startTurn) / shrinkEvery) + 1
    return {
        radius: Math.max(-1 , startRadius - phase),
        damage: baseDamage * phase,
        phase
    };
}

