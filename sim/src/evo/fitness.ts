import type { SeatStats } from "../sim/stats.ts";

export function fitness(stats: SeatStats): number {
    return stats.wins * 100 + stats.survivalTurns + stats.damageDealt
}