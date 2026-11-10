import type { Logger } from 'drizzle-orm'

// Statement text only. Params are never logged: an insert into matches
// carries the match secret.
export const queryLogger: Logger = {
    logQuery(query) {
        console.log(`query: ${query}`)
    },
}
