import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'
import { db } from './client.ts'

export async function runMigrations() {
    await migrate(db, {
        migrationsFolder: path.join(import.meta.dirname, '../../', 'drizzle')
    })
}