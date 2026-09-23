import type { Rng } from "./util/random";

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
    position: Position
}

export type World = {
    turn: number,
    turnCap: number,
    width: number,
    height: number,
    ships: Ship[]

}

// Screen coordinates: origin (0,0) is the TOP-LEFT tile.
// x grows to the right, y grows DOWNWARD (row 0 is the top row).
// So "north" (up on screen) is dy = -1, "south" is dy = +1.
// If a ship walks off the wrong edge, this is the first place to look.
// Distances are Chebyshev: diagonal neighbors are distance 1, matching 8-direction movement.

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'STAY';

export type Delta = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 };



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

export const DIRECTIONS = Object.keys(DELTAS) as Direction[];

export type Action = {
    move: Direction,
    attack?: Ship["id"]
}

export type VisibleShip = Pick<Ship, 'id' | 'position' | 'hp'>;

export type Observation = {
    self: Ship,
    visibleShips: VisibleShip[],
    map: Omit<World, 'ships'>
}

// input is Observation, output is Action. Each player is handed Observation data and must return Action data
export interface Brain {
    decide(obs: Observation): Action;
}

export type Entrant = {
    name: string
    make: (rng: Rng) => Brain
}
