import { describe, it, expect } from "vitest"
import { evaluate } from "./evaluate.ts"
import { randomWeights } from "./net.ts"
import { makeRng } from "../util/random.ts"
import { inputsFor, ENCODING_VERSION } from "./encode.ts"

const N = inputsFor(ENCODING_VERSION)

describe('evaluate', () => {
    it('random weights greater than 0', () => {

        expect(evaluate(randomWeights(makeRng(1), N), 1)).toBeGreaterThan(0)
    })
})