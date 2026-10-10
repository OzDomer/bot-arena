import { env } from './config/env.ts'
import app from './app.ts'
import { db } from './db/client.ts'
import { runMigrations } from './db/migrate.ts'



try {
    await db.execute('select 1')
    await runMigrations()
    console.log(`db connected and ready`)
} catch (error) {
    console.error(error)
    console.log('cant start, stopping process')
    process.exit(1)
}


try {
    console.log('setting up db')
    
    console.log('set up complete')
} catch (error) {
    console.error(error)
    console.log('db setup failed')
    process.exit(1)
}


app.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))
