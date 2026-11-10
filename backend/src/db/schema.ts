import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, pgEnum, timestamp, customType, unique, uniqueIndex } from "drizzle-orm/pg-core";

const bytea = customType<{
    data: Buffer;
    driverData: Buffer;
}>({
    dataType() {
        return "bytea";
    },
})
export type Odds = {
    wins: Record<string, number>
    draw: number
    timeout: number
}


export const lineups = pgTable('lineups', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    names: text().array().notNull(),
    preset: text().notNull(),
    simVersion: text().notNull(),
    odds: jsonb().$type<Odds>().notNull(),
    sampleSize: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull()
}, (t) => [
    unique().on(t.names, t.preset, t.simVersion)
])

export const phaseEnum = pgEnum('match_phase', ['scheduled', 'open', 'closed', 'revealed', 'settled'])

export const matches = pgTable('matches', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    lineupId: integer().notNull().references(() => lineups.id),
    phase: phaseEnum().notNull(),
    secret: bytea().notNull(),
    commitHash: text().unique().notNull(),
    opensAt: timestamp({ withTimezone: true }).notNull(),
    closesAt: timestamp({ withTimezone: true }).notNull(),
    startsAt: timestamp({ withTimezone: true }),
    turns: integer(),
    winner: text(),
    settledAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull()

})

export const STARTING_CREDITS = 1000

// The name is stored as typed and is unique regardless of case: "Oz" and
// "oz" are the same account. Lookups by name compare lower(name) too.
export const users = pgTable('users', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    passwordHash: text().notNull(),
    credits: integer().notNull().default(STARTING_CREDITS),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull()
}, (t) => [
    uniqueIndex('users_name_lower_unique').on(sql`lower(${t.name})`)
])
