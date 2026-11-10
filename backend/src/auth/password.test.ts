import bcrypt from 'bcryptjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hashPassword, verifyPassword } from './password.ts'

describe('password hashing', () => {
    afterEach(() => vi.restoreAllMocks())

    it('hashes with cost 10, differs from the password and verifies the password', async () => {
        const password = 'correct_password'
        const hash = await hashPassword(password)

        expect(hash).not.toBe(password)
        expect(bcrypt.getRounds(hash)).toBe(10)
        expect(await verifyPassword(password, hash)).toBe(true)
    })

    it('rejects a wrong password', async () => {
        const hash = await hashPassword('correct_password')

        expect(await verifyPassword('wrong_password', hash)).toBe(false)
    })

    it('runs one comparison against the same cost-10 dummy hash when a user hash is missing', async () => {
        const compare = vi.spyOn(bcrypt, 'compare')

        expect(await verifyPassword('unknown_user_password')).toBe(false)
        expect(compare).toHaveBeenCalledTimes(1)
        const dummyHash = compare.mock.calls[0][1]
        expect(bcrypt.getRounds(dummyHash)).toBe(10)

        await verifyPassword('another_unknown_password')
        expect(compare).toHaveBeenCalledTimes(2)
        expect(compare.mock.calls[1][1]).toBe(dummyHash)
    })
})
