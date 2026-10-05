import express from 'express'
import logError from './middlewares/error/logError.ts'
import errorResponder from './middlewares/error/errorResponder.ts'
import notFound from './middlewares/notFound.ts'



const app = express()

app.use(express.json())

app.get('/health', (_req, res) => {
    res.status(200).json({ healthy: "bery" })
})

app.use('/', notFound)

app.use('/', logError)
app.use('/', errorResponder)

export default app


