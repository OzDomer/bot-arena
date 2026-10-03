import type { Hit, Ship, World } from "../types"

export type SeatStats = {
    matches: number
    wins: number
    survivalTurns: number   // summed; divide by matches for the average
    damageDealt: number
    damageTaken: number
    kills: number
}

export function emptyStats(): SeatStats {
    return {
        matches: 0,
        wins: 0,
        survivalTurns: 0,
        damageDealt: 0,
        damageTaken: 0,
        kills: 0,
    }
}
export function addStats(into: SeatStats, from: SeatStats): void {
    into.matches += from.matches
    into.wins += from.wins
    into.damageDealt += from.damageDealt
    into.damageTaken += from.damageTaken
    into.kills += from.kills
    into.survivalTurns += from.survivalTurns
}

export class MatchStats {
    private stats: Record<Ship['id'], SeatStats>   // keyed by ship id for now
    private prevHp: Record<Ship['id'], number>
    private deathTurn: Record<Ship['id'], number>

    constructor(world: World) {
        this.stats = {}
        this.prevHp = {}
        this.deathTurn = {}
        for (const ship of world.ships) {
            this.stats[ship.id] = emptyStats()
            this.prevHp[ship.id] = ship.hp
        }

    }

    onTurn(world: World, hits: Hit[]) {
        for (const hit of hits) {
            this.stats[hit.target].damageTaken += hit.amount
            this.stats[hit.attacker].damageDealt += hit.amount
        }
        for (const ship of world.ships) {
            if (this.prevHp[ship.id] > 0 && ship.hp <= 0) this.deathTurn[ship.id] = world.turn
        }
        for (const hit of hits) {
            if (this.deathTurn[hit.target] === world.turn) this.stats[hit.attacker].kills++
        }
        for (const ship of world.ships) {
            this.prevHp[ship.id] = ship.hp
        }
    }

    finish(final: World): Record<Ship['id'], SeatStats> {
        const alive = final.ships.filter(s => s.hp > 0)
        for (const ship of final.ships) {
            const s = this.stats[ship.id]
            s.matches = 1
            s.survivalTurns = this.deathTurn[ship.id] ?? final.turn    // deathTurn if recorded, else final.turn
            s.wins = (alive.length === 1 && alive[0].id === ship.id) ? 1 : 0            // 1 if this ship is the sole survivor, else 0
        }
        return this.stats
    }
}