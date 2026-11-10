export async function matchesCommitment(secret: Uint8Array<ArrayBuffer>, commitHash: string): Promise<boolean> {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', secret))
    const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return hex === commitHash.toLowerCase()
}
