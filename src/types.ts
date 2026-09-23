import type { Rng } from "./util/random"

export type Position = {
    x: number,
    y: number
};

export type Ship = {
    id: number,
    maxHp: number,
    hp: number,
    attackDamage: number,
    visionRange: number,
    attackRange: number,
    position: Position,
    facing: Facing
}

export type World = {
    rules: Rules
    turn: number,
    ships: Ship[],
    storm: { center: Position }

}

// Screen coordinates: origin (0,0) is the TOP-LEFT tile.
// x grows to the right, y grows DOWNWARD (row 0 is the top row).
// So "north" (up on screen) is dy = -1, "south" is dy = +1.
// If a ship walks off the wrong edge, this is the first place to look.
// Distances are Chebyshev: diagonal neighbors are distance 1, matching 8-direction movement.

export const DELTAS: Record<Direction, Delta> = {
    N: { dx: 0, dy: -1 },
    NE: { dx: 1, dy: -1 },
    E: { dx: 1, dy: 0 },
    SE: { dx: 1, dy: 1 },
    S: { dx: 0, dy: 1 },
    SW: { dx: -1, dy: 1 },
    W: { dx: -1, dy: 0 },
    NW: { dx: -1, dy: -1 },
    STAY: { dx: 0, dy: 0 },
}


export type Arc = 'front' | 'side' | 'rear'

export type Facing = Exclude<Direction, 'STAY'>

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'STAY'

export type Delta = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }

export const DIRECTIONS = Object.keys(DELTAS) as Direction[]

export const FACING = DIRECTIONS.filter(d => d !== 'STAY') as Facing[]



export type Action = {
    move: Direction,
    attack?: Ship["id"]
}

export type VisibleShip = Pick<Ship, 'id' | 'position' | 'hp' | 'facing'>;

export type Observation = {
    self: Ship,
    visibleShips: VisibleShip[],
    map: Omit<World, 'ships'>
}

// input is Observation, output is Action. Each player is handed Observation data and must return Action data
export interface Brain {
    decide(obs: Readonly<Observation>): Action;
}

export type Entrant = {
    name: string
    make: (rng: Rng) => Brain
}


export type Rules = {
    width: number;
    height: number;
    turnCap: number;
    ship: { hp: number; attackDamage: number; visionRange: number; attackRange: number };
    arcMult: Record<Arc, number>;
    storm: { startTurn: number; shrinkEvery: number; baseDamage: number };
}

export const DEFAULT_RULES: Rules = {
    width: 10,
    height: 10,
    turnCap: 200,
    ship: { hp: 10, attackDamage: 2, visionRange: 3, attackRange: 1 },
    arcMult: { front: 1, side: 1, rear: 2 },
    storm: { startTurn: 20, shrinkEvery: 10, baseDamage: 1 },
};