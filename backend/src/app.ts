import express from 'express'
import { env } from './config/env'



const app = express()

app.use(express.json())

app.get('/health', (_req, res) => {
    res.status(200).json({healthy: "bery"})
})

app.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))