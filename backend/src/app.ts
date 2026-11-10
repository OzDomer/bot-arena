import express from 'express'
import cors from 'cors'
import { env } from './config/env.ts'
import logError from './middlewares/error/logError.ts'
import errorResponder from './middlewares/error/errorResponder.ts'
import notFound from './middlewares/notFound.ts'
import liveRouter from './routers/live.ts'
import matchesRouter from './routers/matches.ts'
import streamRouter from './routers/stream.ts'

const app = express()

app.disable('x-powered-by')

// one allowed origin, from env; the stream is covered too
app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json())

app.get('/health', (_req, res) => {
    res.status(200).json({ healthy: "bery" })
})

app.use('/live', liveRouter)
app.use('/matches', matchesRouter)
app.use('/stream', streamRouter)

app.use('/', notFound)

app.use('/', logError)
app.use('/', errorResponder)

export default app
