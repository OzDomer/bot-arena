import { describe, expect, it } from "vitest"
import { PolicyBrain, type Decision } from "./PolicyBrain"
import { makeRng } from "../util/random"
import { observe } from "../sim/observe"
import { world, ship } from "../test/fixtures"
import { randomWeights } from "./net"
import { DIRECTIONS } from "../types"
import { inputsFor, ENCODING_VERSION } from "./encode"

const N = inputsFor(ENCODING_VERSION)


describe('PolicyBrain', () => {
    it('index to direction works', () => {
        const buffer: Decision[] = []
        const brain = new PolicyBrain(randomWeights(makeRng(1), N), makeRng(2), buffer)

        const w = world([ship({ id: 1, position: { x: 5, y: 5 } })])
        const obs = observe(w, w.ships[0])

        const action = brain.decide(obs)
        expect(buffer.length).toBe(1)
        expect(buffer[0].x.length).toBe(N)
        expect(buffer[0].probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
        expect(action.move).toEqual(DIRECTIONS[buffer[0].a])
    })

})


