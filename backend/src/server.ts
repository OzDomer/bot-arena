import { env } from './config/env.ts'
import app from './app.ts'
import { db } from './db/client.ts'


try {
    await db.execute('select 1')
    console.log(`connection to db succesful`)
} catch (error) {
    console.error(error)
    console.log('cant start, stopping process')
    process.exit(1)
}

app.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))
