import { describe, expect, it } from "vitest"
import { canonicalNames } from "./canonicalNames.ts"

describe('canonicalNames', () => {
    it('two ordering identical output', () => {
        const lineup1 = ['thor', 'kratos', 'hades']
        const lineup2 = ['kratos', 'thor', 'hades']
        expect(canonicalNames(lineup1)).toEqual([ 'hades', 'kratos', 'thor' ])
        expect(canonicalNames(lineup1)).toEqual(canonicalNames(lineup2))
    })
    it('does not mutate its input', () => {
        const input = ['thor', 'kratos', 'hades']
        const before = [...input]
        canonicalNames(input)
        expect(input).toEqual(before)
    })
    it('duplicate entries throw', () => {
        const original = ['thor', 'kratos', 'hades', 'kratos']
        expect(() => canonicalNames(original)).toThrow('duplicate')
    })
})