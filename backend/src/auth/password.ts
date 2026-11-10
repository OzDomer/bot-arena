import bcrypt from 'bcryptjs'

// A fixed cost-10 hash keeps an unknown-name login on the bcrypt comparison path.
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string = DUMMY_HASH): Promise<boolean> {
    return bcrypt.compare(password, hash)
}
