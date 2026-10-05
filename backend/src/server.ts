import { env } from './config/env'
import app from './app'



const server = app




server.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))
