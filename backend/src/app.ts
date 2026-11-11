import express from 'express'
import cors from 'cors'
import { env } from './config/env.ts'
import logError from './middlewares/error/logError.ts'
import errorResponder from './middlewares/error/errorResponder.ts'
import notFound from './middlewares/notFound.ts'
import liveRouter from './routers/live.ts'
import matchesRouter from './routers/matches.ts'
import streamRouter from './routers/stream.ts'
import authRouter from './routers/auth.ts'
import meRouter from './routers/me.ts'
import jsonError from './middlewares/error/jsonError.ts'
import authLimiter from './middlewares/authLimiter.ts'

const app = express()

app.disable('x-powered-by')
// a hop count, never true: only what our own proxies appended is believed
app.set('trust proxy', env.TRUST_PROXY_HOPS)

// one allowed origin, from env; the stream is covered too
app.use(cors({ origin: env.CORS_ORIGIN }))
// after cors so the browser can read a 429
app.use('/auth', authLimiter)
app.use(express.json())

app.get('/health', (_req, res) => {
    res.status(200).json({ healthy: "bery" })
})

app.use('/live', liveRouter)
app.use('/matches', matchesRouter)
app.use('/stream', streamRouter)
app.use('/auth', authRouter)
app.use('/me', meRouter)

app.use('/', notFound)

app.use('/', jsonError)
app.use('/', logError)
app.use('/', errorResponder)

export default app
