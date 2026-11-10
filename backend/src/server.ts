import { env } from './config/env.ts'
import app from './app.ts'
import { db } from './db/client.ts'
import { runMigrations } from './db/migrate.ts'
import { getLive, startLive, tick } from './matches/live.ts'
import { liveSnapshotOf } from './matches/snapshot.ts'
import { broadcast, startHeartbeat } from './realtime/broadcaster.ts'



try {
    await db.execute('select 1')
    await runMigrations()
    await startLive(new Date())
    console.log(`db connected and ready`)
    startHeartbeat()
    setInterval(() => {
        tick(new Date()).then((changed) => {
            // stamped when it is sent, not when the tick began: a tick that
            // computes odds takes seconds, and clients set their clock from it
            if (changed) broadcast(liveSnapshotOf(getLive(), new Date()))
        }).catch((error) => console.error('tick failed', error))
    }, 1000)
} catch (error) {
    console.error(error)
    console.log('cant start, stopping process')
    process.exit(1)
}



app.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))
