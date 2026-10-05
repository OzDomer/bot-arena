import { integer, jsonb, pgTable, text, pgEnum, timestamp, customType, unique } from "drizzle-orm/pg-core";

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
    winner: text(),
    settledAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull()

})