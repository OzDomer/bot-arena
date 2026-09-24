import { DIRECTIONS, type Action, type Observation, type Ship } from "../types";
import { directionToward, chebyshev, inCircle } from "../sim/geometry";
import { pickRandom } from "../util/random";
import { RandomizedBot } from "./RandomizedBot";


type State = 'wander' | 'chase';

export class ChaserV2 extends RandomizedBot {
    private state: State = 'wander';
    private targetId: Ship['id'] | undefined;

    decide(obs: Observation): Action {
        const target = obs.visibleShips.find(ship => ship.id === this.targetId && ship.hp > 0)
        const isSafe = inCircle(obs.self.position, obs.storm.center, obs.storm.radius)
        if (!isSafe) {
            const inRange = obs.visibleShips.find(s => s.hp > 0 && chebyshev(obs.self.position, s.position) <= obs.self.attackRange)
            return { move: directionToward(obs.self.position, obs.storm.center), attack: inRange?.id }
        }
        if (this.state === 'chase' && !target) {
            this.state = 'wander';
            this.targetId = undefined;
        }
        const aliveShips = obs.visibleShips.filter(ship => ship.hp > 0)
        if (this.state === 'wander' && aliveShips.length > 0) {
            const byDistance = aliveShips.sort((a, b) => chebyshev(obs.self.position, a.position) - chebyshev(obs.self.position, b.position));
            this.targetId = byDistance[0].id;
            this.state = 'chase';
        }
        const locked = obs.visibleShips.find(s => s.id === this.targetId && s.hp > 0)

        if (this.state === 'chase' && locked) {
            const move = directionToward(obs.self.position, locked.position);
            const inRange = chebyshev(obs.self.position, locked.position) <= obs.self.attackRange;
            return { move, attack: inRange ? locked.id : undefined };
        }
        const move = pickRandom(DIRECTIONS, this.rng);
        const inRangeTarget = obs.visibleShips.find(ship => chebyshev(obs.self.position, ship.position) <= obs.self.attackRange);
        return { move, attack: inRangeTarget?.id };

    }
}
