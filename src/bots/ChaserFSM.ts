import { DELTAS, type Action, type Brain, type Direction, type Observation, type Ship } from "../types";
import { directionToward, manhattan } from "../sim/geometry";
import { pickRandom } from "../util/random";

const DIRECTIONS = Object.keys(DELTAS) as Direction[]


type State = 'wander' | 'chase';

export class ChaserFSM implements Brain {
    private state: State = 'wander';
    private targetId: Ship['id'] | undefined;

    decide(obs: Observation): Action {
        const target = obs.visibleShips.find(ship => ship.id === this.targetId && ship.hp > 0);
        if (this.state === 'chase' && !target) {
            this.state = 'wander';
            this.targetId = undefined;
        }
        const aliveShips = obs.visibleShips.filter(ship => ship.hp > 0)
        if (this.state === 'wander' && aliveShips.length > 0) {
            const byDistance = aliveShips.sort((a, b) => manhattan(obs.self.position, a.position) - manhattan(obs.self.position, b.position));
            this.targetId = byDistance[0].id;
            this.state = 'chase';
        }
        const locked = obs.visibleShips.find(s => s.id === this.targetId && s.hp > 0);

        if (this.state === 'chase' && locked) {
            const move = directionToward(obs.self.position, locked.position);
            const inRange = manhattan(obs.self.position, locked.position) <= obs.self.attackRange;
            return { move, attack: inRange ? locked.id : undefined };
        }
        const move = pickRandom(DIRECTIONS);
        const inRangeTarget = obs.visibleShips.find(ship => manhattan(obs.self.position, ship.position) <= obs.self.attackRange);
        return { move, attack: inRangeTarget?.id };

    }
}
