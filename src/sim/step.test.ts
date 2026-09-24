import { describe, it, expect } from 'vitest'
import { step } from './step'
import { ship, world } from '../test/fixtures'


describe('step', () => {
    it('resolves attacks simultaneously', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'W' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY', attack: 1 } });
        expect(next.ships[0].hp).toBe(8);
        expect(next.ships[1].hp).toBe(8);
    })

    it('doubles damage from the rear', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(10);
        expect(next.ships[1].hp).toBe(6);
    })

    it('front damage correct', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'W' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } });
        expect(next.ships[0].hp).toBe(10);
        expect(next.ships[1].hp).toBe(8);
    })

    it('side damage correct', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'S' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } });
        expect(next.ships[0].hp).toBe(10);
        expect(next.ships[1].hp).toBe(8);
    })

    it('stay preserves facing', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY' } });
        expect(next.ships[0].facing).toBe('E');

    })

    it('attack uses pre move facing', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'W' } });
        expect(next.ships[0].hp).toBe(10)
        expect(next.ships[1].hp).toBe(6)
        expect(next.ships[1].facing).toBe('W')
    })

    it('out of range attack does nothing', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 7 }, facing: 'W' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(10);
        expect(next.ships[1].hp).toBe(10);
    })

    it('dead ship cant attack', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W', hp: 0 }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(0);
        expect(next.ships[1].hp).toBe(10);
    })

    it('movement clamps at the edge', () => {
        const w = world([
            ship({ id: 1, position: { x: 0, y: 5 }, facing: 'W' }),
        ])
        const next = step(w, { 1: { move: 'W' } })
        expect(next.ships[0].position).toEqual({ x: 0, y: 5 });
    })

    it('wreck blocks a tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W', hp: 0 }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 2: { move: 'W' } })
        expect(next.ships[1].position).toEqual({ x: 6, y: 5 })
        expect(next.ships[1].facing).toBe('W')
    })

    it('lower id gets tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
        ])
        const next = step(w, { 1: { move: 'NE' }, 2: { move: 'N' } })
        expect(next.ships[0].position).toEqual({ x: 6, y: 4 })
        expect(next.ships[1].position).toEqual({ x: 6, y: 5 })
    })

    it('increments turn without mutating input', () => {
        const w = world([])
        const next = step(w, {})
        expect(next.turn).toBe(1)
        expect(w.turn).toBe(0)
    })

    it('no storm damage before start turn', () => {
        const w = world([
            ship({ id: 1, position: { x: 9, y: 9 }, facing: 'W' })]
        )
        const next = step(w, { 1: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(10)

    })

    it('no storm damage at turn 20 in a safe tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W' })], 20
        )
        const next = step(w, { 1: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(10)

    })
    it('corner takes phase 3 damage at turn 40', () => {
        const w = world([
            ship({ id: 1, position: { x: 0, y: 0 }, facing: 'W' })], 40
        )
        const next = step(w, { 1: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(7)

    })
    it('corner still safe at turn 39', () => {
        const w = world([
            ship({ id: 1, position: { x: 0, y: 0 }, facing: 'W' })], 39
        )
        const next = step(w, { 1: { move: 'STAY' } })
        expect(next.ships[0].hp).toBe(10)

    })
    it('wreck stays at 0 outside of storm', () => {
        const w = world([
            ship({ id: 1, position: { x: 0, y: 0 }, facing: 'W', hp: 0 })], 199
        )
        const next = step(w, { 1: { move: 'STAY' } })
        expect(next.ships[0]).toStrictEqual(w.ships[0])
    })

    it('storm and an attack damage tick in the same turn', () => {
        const w = world([
            ship({ id: 1, position: { x: 0, y: 0 }, facing: 'E' }),
            ship({ id: 2, position: { x: 1, y: 0 }, facing: 'W' })], 50)

        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })

        expect(next.ships[1].hp).toBe(4)
    })

    it('no safe space in the last phase of the storm', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'W' })], 199)

        const next = step(w, { 1: { move: 'STAY', attack: 2 }, 2: { move: 'STAY' } })

        expect(next.ships[0].hp).toBe(0)

    })

    it('two ships pushing into the edge do not share a tile', () => {
        const w = world([
            ship({ id: 1, position: { x: 8, y: 0 }, facing: 'E' }),
            ship({ id: 2, position: { x: 9, y: 0 }, facing: 'E' })])

        const next = step(w, { 1: { move: 'E' }, 2: { move: 'NE' } })

        expect(next.ships[0].position).toEqual({ x: 8, y: 0 })
        expect(next.ships[1].position).toEqual({ x: 9, y: 0 })
    })

    it('a bounce cannot land on a tile another ship moved into', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'E' }),
            ship({ id: 3, position: { x: 7, y: 5 }, facing: 'E', hp: 0 })])

        const next = step(w, { 1: { move: 'E' }, 2: { move: 'E' } })

        expect(next.ships[0].position).toEqual({ x: 5, y: 5 })
        expect(next.ships[1].position).toEqual({ x: 6, y: 5 })
    })

    it('ships cannot swap tiles', () => {
        const w = world([
            ship({ id: 1, position: { x: 5, y: 5 }, facing: 'E' }),
            ship({ id: 2, position: { x: 6, y: 5 }, facing: 'W' })])

        const next = step(w, { 1: { move: 'E' }, 2: { move: 'W' } })

        expect(next.ships[0].position).toEqual({ x: 5, y: 5 })
        expect(next.ships[0].facing).toEqual('E')
        expect(next.ships[1].position).toEqual({ x: 6, y: 5 })
        expect(next.ships[1].facing).toEqual('W')
    })
})
