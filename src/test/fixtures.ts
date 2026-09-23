import { mapCenter } from "../sim/geometry";
import { DEFAULT_RULES, type Rules, type Ship, type World } from "../types";

export function ship(over: Partial<Ship> & { id: number }): Ship {
    return {
        hp: 10, maxHp: 10, attackDamage: 2, visionRange: 3, attackRange: 1,
        position: { x: 0, y: 0 }, facing: 'N', ...over
    };
}

export function world(ships: Ship[], rules: Rules = DEFAULT_RULES): World {
    return { turn: 0, rules, ships, storm: { center: mapCenter(rules) } };
}