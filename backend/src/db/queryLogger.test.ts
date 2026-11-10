import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryLogger } from './queryLogger.ts'

describe('queryLogger', () => {
    afterEach(() => vi.restoreAllMocks())

    it('logs the statement and leaves the params out', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {})

        queryLogger.logQuery('insert into "matches" ("secret") values ($1)', ['c0ffee'])

        expect(log).toHaveBeenCalledTimes(1)
        const line = log.mock.calls[0].join(' ')
        expect(line).toContain('insert into "matches" ("secret") values ($1)')
        expect(line).not.toContain('c0ffee')
    })
})
