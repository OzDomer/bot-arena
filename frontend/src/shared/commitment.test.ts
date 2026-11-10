import { describe, expect, it } from 'vitest'
import { matchesCommitment } from './commitment'
import { secretFromHex } from './hex'

const VECTOR_HEX = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'
const VECTOR_HASH = '4773d12e2371bb935b9a0f5439b4a1c3ad3f2414b86980f8418d1cfabdfadfef'

describe('matchesCommitment', () => {
    it('true for the test vector', async () => {
        const secret = secretFromHex(VECTOR_HEX)
        const result = await matchesCommitment(secret, VECTOR_HASH)
        expect(result).toBe(true)
    })

    it('true for the vector hash in upper case', async () => {
        const secret = secretFromHex(VECTOR_HEX)
        const result = await matchesCommitment(secret, VECTOR_HASH.toUpperCase())
        expect(result).toBe(true)
    })

    it('false when one hex digit of the hash is changed', async () => {
        const secret = secretFromHex(VECTOR_HEX)
        const result = await matchesCommitment(secret, VECTOR_HASH.slice(0, 62) + 'g')
        expect(result).toBe(false)
    })

    it('false when one byte of the secret is changed', async () => {
        const altered = secretFromHex('01112233445566778899aabbccddeeff00112233445566778899aabbccddeeff')
        const result = await matchesCommitment(altered, VECTOR_HASH)
        expect(result).toBe(false)
    })

    it('false for an empty commitHash', async () => {
        const secret = secretFromHex(VECTOR_HEX)
        const result = await matchesCommitment(secret, '')
        expect(result).toBe(false)
    })

    it('hashes only the bytes of a view into a larger buffer', async () => {
        const buffer = new ArrayBuffer(40)
        new Uint8Array(buffer).fill(0xff)
        new Uint8Array(buffer).set(secretFromHex(VECTOR_HEX), 4)
        const view = new Uint8Array(buffer, 4, 32)
        const result = await matchesCommitment(view, VECTOR_HASH)
        expect(result).toBe(true)
    })
})
