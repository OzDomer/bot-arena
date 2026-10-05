import { env } from './config/env.ts'
import app from './app.ts'
import { db } from './db/client.ts'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'


try {
    await db.execute('select 1')
    console.log(`connection to db succesful`)
} catch (error) {
    console.error(error)
    console.log('cant start, stopping process')
    process.exit(1)
}


try {
    console.log('setting up db')
    await migrate(db, {
        migrationsFolder: path.join(import.meta.dirname, '..', 'drizzle')
    })
    console.log('set up complete')
} catch (error) {
    console.error(error)
    console.log('db setup failed')
    process.exit(1)
}


app.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))
