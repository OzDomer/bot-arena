import { describe, expect, it } from 'vitest'
import { isUniqueViolation } from './isUniqueViolation.ts'

describe('isUniqueViolation', () => {
    it('recognizes Postgres code 23505 on a wrapped driver error', () => {
        const cause = Object.assign(new Error('duplicate'), { code: '23505' })

        expect(isUniqueViolation(new Error('query failed', { cause }))).toBe(true)
    })

    it.each([
        null, '23505', {}, new Error('other failure'),
        new Error('query failed', { cause: Object.assign(new Error('other code'), { code: '08006' }) }),
    ])('does not classify an unrelated error as a unique violation: %s', (error) => {
        expect(isUniqueViolation(error)).toBe(false)
    })
})
