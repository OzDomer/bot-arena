CREATE TYPE "public"."match_phase" AS ENUM('scheduled', 'open', 'closed', 'revealed', 'settled');--> statement-breakpoint
CREATE TABLE "lineups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lineups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"names" text[] NOT NULL,
	"preset" text NOT NULL,
	"sim_version" text NOT NULL,
	"odds" jsonb NOT NULL,
	"sample_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lineups_names_preset_simVersion_unique" UNIQUE("names","preset","sim_version")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "matches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lineup_id" integer NOT NULL,
	"phase" "match_phase" NOT NULL,
	"secret" "bytea" NOT NULL,
	"commit_hash" text NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"starts_at" timestamp with time zone,
	"winner" text,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_commitHash_unique" UNIQUE("commit_hash")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE no action ON UPDATE no action;