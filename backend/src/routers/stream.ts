import { Router } from 'express'
import { getLive } from '../matches/live.ts'
import { liveSnapshotOf } from '../matches/snapshot.ts'
import { addClient, removeClient } from '../realtime/broadcaster.ts'

const streamRouter = Router()

streamRouter.get('/', (req, res) => {
    const snapshot = liveSnapshotOf(getLive(), new Date())

    // writeHead, not res.set: Express would append a charset to the type
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    })
    res.flushHeaders()
    res.write(`event: state\ndata: ${JSON.stringify(snapshot)}\n\n`)

    addClient(res)
    req.once('close', () => removeClient(res))
})

export default streamRouter
