import { DELTAS, type Action, type Brain, type Direction, type Observation, type Ship } from "../types";
import { closestTo, directionAway, directionToward, manhattan } from "../sim/geometry";
import { pickRandom } from "../util/random";

const DIRECTIONS = Object.keys(DELTAS) as Direction[]


type State = 'wander' | 'chase' | 'flee';

export class CowardFSM implements Brain {
    private state: State = 'wander';
    private targetId: Ship['id'] | undefined
    private lastFlee: Direction | undefined

    decide(obs: Observation): Action {
        const target = obs.visibleShips.find(ship => ship.id === this.targetId && ship.hp > 0);
        const aliveShips = obs.visibleShips.filter(ship => ship.hp > 0)
        if (this.state === 'chase' && !target) {
            this.state = 'wander';
            this.targetId = undefined;
        }
        if (obs.self.hp <= obs.self.maxHp * 0.45) {
            this.state = 'flee';
            this.targetId = undefined;
            const threat = closestTo(obs.self.position, aliveShips);

            if (threat) {
                this.lastFlee = directionAway(obs.self.position, threat.position);
            } else if (!this.lastFlee) {
                this.lastFlee = pickRandom(DIRECTIONS);
            }
            return { move: this.lastFlee };
        }
        const closest = closestTo(obs.self.position, aliveShips)
        if (this.state === 'wander' && closest) {
            this.targetId = closest.id;
            this.state = 'chase';
        }
        const locked = obs.visibleShips.find(s => s.id === this.targetId && s.hp > 0);

        if (this.state === 'chase' && locked) {
            const move = directionToward(obs.self.position, locked.position);
            const inRange = manhattan(obs.self.position, locked.position) <= obs.self.attackRange;
            return { move, attack: inRange ? locked.id : undefined };
        }

        const move = pickRandom(DIRECTIONS);
        const inRangeTarget = aliveShips.find(ship => manhattan(obs.self.position, ship.position) <= obs.self.attackRange);
        return { move, attack: inRangeTarget?.id };

    }
}
