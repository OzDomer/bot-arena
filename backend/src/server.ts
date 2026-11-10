import { env } from './config/env.ts'
import app from './app.ts'
import { db } from './db/client.ts'
import { runMigrations } from './db/migrate.ts'
import { loadLive, tick } from './matches/live.ts'



try {
    await db.execute('select 1')
    await runMigrations()
    await loadLive()
    console.log(`db connected and ready`)
    setInterval(() => {
        tick(new Date()).catch((error) => console.error('tick failed', error))
    }, 1000)
} catch (error) {
    console.error(error)
    console.log('cant start, stopping process')
    process.exit(1)
}



app.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))
