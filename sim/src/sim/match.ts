import type { Action, Brain, Hit, Ship, World } from "../types";
import { resolveAttacks } from "./combat";
import { observe } from "./observe";
import { step } from "./step";

export function runMatch(world: World, brains: Record<Ship['id'], Brain>, onTurn?: (world: World, hits: Hit[]) => void): World {
    while (world.turn < world.rules.turnCap) {
        const actions: Record<Ship['id'], Action> = {};

        for (const ship of world.ships) {
            if (ship.hp <= 0) continue;
            const obs = observe(world, ship);
            actions[ship.id] = brains[ship.id].decide(obs);
        }
        const hits = resolveAttacks(world, actions)
        world = step(world, actions)
        onTurn?.(world, hits)
        const aliveShips = world.ships.filter(ship => ship.hp > 0)
        if (aliveShips.length <= 1) break
    }
    return world
}