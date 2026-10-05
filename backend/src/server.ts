import { env } from './config/env.ts'
import app from './app.ts'





app.listen(env.PORT, () => console.log(`listening on port: ${env.PORT}`))
