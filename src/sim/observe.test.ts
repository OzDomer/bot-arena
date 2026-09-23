import { describe, expect, it } from "vitest";
import { ship, world } from "../test/fixtures";
import { observe } from "./observe";

describe('observe', () => {
    it('sees a ship within vision range', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'W' }),
        ])
        const obs = observe(w, w.ships[0])
        expect(obs.visibleShips[0].id).toBe(2)
    })
    it('doesnt see a ship outside vision range', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 9 }, facing: 'W' }),
        ])
        const obs = observe(w, w.ships[0])
        expect(obs.visibleShips.length).toBe(0)
    })
    it('doesnt include itself in visible ships', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
        ])
        const obs = observe(w, w.ships[0])
        expect(obs.visibleShips.length).toBe(0)
    })
    it('map does not leak the ship list', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })]);
        const obs = observe(w, w.ships[0]);
        expect(obs.map).not.toHaveProperty('ships');
    })
    it('does not expose the world to mutation', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })]);
        const obs = observe(w, w.ships[0]);
        obs.self.position.x = 99;
        expect(w.ships[0].position.x).toBe(5);
    })

    it('exposes the storm state for the current turn', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })], 40)
        const obs = observe(w, w.ships[0])
        expect(obs.storm).toEqual({ center: { x: 5, y: 5 }, radius: 7, damage: 3 })
    })

    it('storm center does not expose the world to mutation', () => {
        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })])
        const obs = observe(w, w.ships[0])
        obs.storm.center.x = 8
        expect(w.storm.center).toEqual({ x: 5, y: 5 })
    })
})