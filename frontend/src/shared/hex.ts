export function secretFromHex(hex: string): Uint8Array<ArrayBuffer> {
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) throw new Error('secret must be 64 hex characters')
    const bytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    return bytes
}
