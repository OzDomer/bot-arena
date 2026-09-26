import { describe, it, expect } from "vitest"
import { evaluate } from "./evaluate"
import { randomWeights } from "./net"
import { makeRng } from "../util/random"
describe('evaluate', () => {
    it('random weights greater than 0', () => {

        expect(evaluate(randomWeights(makeRng(1)))).toBeGreaterThan(0)
    })
})