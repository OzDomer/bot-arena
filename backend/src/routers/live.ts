import { Router } from 'express'
import { getLive } from '../matches/live.ts'
import { liveSnapshotOf } from '../matches/snapshot.ts'

const liveRouter = Router()

liveRouter.get('/', (_req, res) => {
    res.json(liveSnapshotOf(getLive(), new Date()))
})

export default liveRouter
