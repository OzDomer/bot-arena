import { describe, expect, it } from 'vitest'
import { secretFromHex } from './hex'

describe('secretFromHex', () => {
    it('all-zero secret', () => {
        const hex = '0'.repeat(64)
        const result = secretFromHex(hex)
        expect(result).toBeInstanceOf(Uint8Array)
        for (let i = 0; i < 32; i++) {
            expect(result[i]).toBe(0)
        }
    })

    it('ff repeated 32 gives 32 bytes of 255', () => {
        const hex = 'ff'.repeat(32)
        const result = secretFromHex(hex)
        expect(result).toBeInstanceOf(Uint8Array)
        for (let i = 0; i < 32; i++) {
            expect(result[i]).toBe(255)
        }
    })

    it('a mixed string with first four bytes asserted individually', () => {
        const hex = 'c0ffee01' + '00'.repeat(28)
        const result = secretFromHex(hex)
        expect(result[0]).toBe(0xc0)
        expect(result[1]).toBe(0xff)
        expect(result[2]).toBe(0xee)
        expect(result[3]).toBe(0x01)
    })

    it('upper case equals lower case', () => {
        const lower = 'c0ffee01' + 'ab'.repeat(28)
        const upper = lower.toUpperCase()
        const u = secretFromHex(upper)
        const l = secretFromHex(lower)
        expect(u).toEqual(l)
    })

    it('the result has length 32 and is a Uint8Array', () => {
        const result = secretFromHex('ab'.repeat(32))
        expect(result.length).toBe(32)
        expect(result).toBeInstanceOf(Uint8Array)
    })

    it('rejects wrong length (63 chars)', () => {
        expect(() => secretFromHex('a'.repeat(63))).toThrow('secret must be 64 hex characters')
    })

    it('rejects wrong length (65 chars)', () => {
        expect(() => secretFromHex('a'.repeat(65))).toThrow('secret must be 64 hex characters')
    })

    it('rejects wrong length (0 chars)', () => {
        expect(() => secretFromHex('')).toThrow('secret must be 64 hex characters')
    })

    it('rejects a non-hex character at the start', () => {
        const input = 'g' + '0'.repeat(63)
        expect(input).toHaveLength(64)
        expect(() => secretFromHex(input)).toThrow('secret must be 64 hex characters')
    })

    it('rejects a non-hex character in the middle', () => {
        const input = '0'.repeat(32) + 'g' + '0'.repeat(31)
        expect(input).toHaveLength(64)
        expect(() => secretFromHex(input)).toThrow('secret must be 64 hex characters')
    })

    it('rejects a non-hex character at the end', () => {
        const input = '0'.repeat(63) + 'g'
        expect(input).toHaveLength(64)
        expect(() => secretFromHex(input)).toThrow('secret must be 64 hex characters')
    })

    it('rejects a 0x prefix', () => {
        const input = '0x' + '0'.repeat(62)
        expect(input).toHaveLength(64)
        expect(() => secretFromHex(input)).toThrow('secret must be 64 hex characters')
    })

    it('rejects a leading space', () => {
        const input = ' ' + '0'.repeat(63)
        expect(input).toHaveLength(64)
        expect(() => secretFromHex(input)).toThrow('secret must be 64 hex characters')
    })

    it('rejects a trailing newline', () => {
        const input = '0'.repeat(63) + '\n'
        expect(input).toHaveLength(64)
        expect(() => secretFromHex(input)).toThrow('secret must be 64 hex characters')
    })
})
