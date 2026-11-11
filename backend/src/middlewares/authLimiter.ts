import { rateLimit } from 'express-rate-limit'

// keyed on req.ip, so it follows the trust proxy setting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'too many attempts, try again later' },
})

export default authLimiter
