import { describe, expect, it } from 'vitest'
import { accountLabel, creditsLabel } from './accountLabel'

const user = { id: 1, name: 'Oz', credits: 1000, createdAt: '2026-01-01T12:00:00.000Z' }

describe('accountLabel', () => {
    it('is the name once logged in', () => {
        expect(accountLabel('authenticated', user)).toBe('Oz')
    })

    it('invites a visitor to log in', () => {
        expect(accountLabel('anonymous', null)).toBe('Log in')
    })

    it('is neutral while a stored session is still being checked', () => {
        expect(accountLabel('loading', null)).toBe('Account')
    })

    it('never shows a name without a user, whatever the status says', () => {
        expect(accountLabel('authenticated', null)).toBe('Account')
    })
})

describe('creditsLabel', () => {
    it.each([
        [0, '0 cr'],
        [1000, '1,000 cr'],
        [1234567, '1,234,567 cr'],
    ])('%d credits reads %s', (credits, label) => {
        expect(creditsLabel(credits)).toBe(label)
    })
})
