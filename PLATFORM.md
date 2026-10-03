# Platform decisions

The full-stack wrapper around the sim: a prediction market on bot matches. Same format as `DECISIONS.md` (what, why, what it takes to revisit). Sim and renderer decisions stay in `DECISIONS.md`; this file never changes a sim rule.

## Freeze
- **The sim is a dependency, not code the platform edits.** The contract is `sim/`'s exports: `Entrant`, `Rules`, `PRESETS`, `playMatch`, `runMatch`, `runTournament`, `deriveSeed`, `makeRng`, and the `World`/`Hit`/`Frame` types. The backend and frontend import those and nothing else from `sim/`.
- Rules work (DECISIONS roadmap 18+) continues in `DECISIONS.md`. A change that touches an *export* gets a line in both files.
- The sim seed stays 32-bit. The platform derives it from its own 256-bit secret (see Fairness); `makeRng`/`deriveSeed` are unchanged.
- Betting lineups use distinct entrant names (`showcase`-style, not `heldout`-style). A bet is on an entrant; duplicate names would make "chaserV2 wins" mean any of three seats. Revisit if a lineup needs duplicates: bet by name with aggregated odds.

## Architecture
- **One repo, three workspace packages:** `sim/` (sim, evo, CLIs, brains), `frontend/` (React shell + `render/`), `backend/` (Express). Both apps depend on `@arena/sim`; nothing depends on an app. Moving `src/sim` and `src/evo` into the package is its own commit, before the React wrap.
- **The server never streams a match.** A match is `(seed, lineup, preset, startAt)`. Every client runs the sim locally and plays back by wall clock: `frame = (now − startAt) / FRAME_MS`. Everyone sees the same frame at the same instant, late joiners land on the right frame, and the server's cost per viewer is one idle connection. This is what determinism buys and it's the headline.
- **The renderer is the audit tool.** Anyone can take a revealed seed, replay the match in the browser, and check the published result. No separate "verify" feature; the frontend already is one.
- **One backend process is the whole backend:** HTTP, SSE fan-out, and the match scheduler. Scaling past one process is under Open.

## Stack
- Express 5, Sequelize (`sequelize-typescript`) on Postgres, Joi validation, `jsonwebtoken`, `config` keyed by `NODE_ENV`, cors, docker compose. Layout `routers/ middlewares/ models/ db/ config/`, error chain `logError → respondError`, `notFound` last.
- Chosen to match the course stack (jb-45800-5 betterx backend) so the platform reads as standard full-stack work. Deviations are called out where they happen (Auth, Realtime); nothing else is clever on purpose.
- Postgres over MySQL: better JSON columns for `entrants`/`odds`, and the more common default in Node stacks. Through Sequelize it's a dialect string; swapping is cheap if ever wanted.

## Match lifecycle
- One match at a time, driven by a scheduler in the backend process:

  | phase | on entry | published |
  |---|---|---|
  | `scheduled` | row created: lineup picked, `secret` generated, `commitHash` stored | nothing |
  | `open` | at `opensAt` | lineup, preset, odds, `commitHash`, `closesAt`; bets accepted |
  | `closed` | at `closesAt` | bets refused; pool frozen |
  | `revealed` | immediately after close | `secret`, derived `seed`, `startAt = now + lead`; clients replay |
  | `settled` | server runs `playMatch`, pays out in one transaction | `winner`, payouts |

- `closed → revealed` is immediate; the gap exists only so "bets are closed" and "here is the seed" are two events, never one.
- `startAt` is a few seconds after reveal so clients can fetch and prepare before frame 0.
- Odds are precomputed per lineup (`runTournament`, 10k matches, ~4 s) when the lineup is inserted, not per match. Lineups come from a curated table; the scheduler rotates through them.
- `winner` is an entrant name, or `draw` / `timeout` (both refund).

## Fairness
- **Commit-reveal.** At `scheduled` the server generates `secret = randomBytes(32)` and stores `commitHash = sha256(secret)`. The hash is public from `open`. After `closed` the secret is published; clients check `sha256(secret) === commitHash` and derive the same seed.
- **Why 32 bytes and not the sim's 32-bit seed.** `makeRng` takes 32 bits. Committing `sha256(seed)` of a 32-bit value is brute-forceable (4 billion hashes) before bets close. The secret has 256 bits of entropy; the sim seed is derived from it (first 4 bytes). No salt, no key: salting protects low-entropy inputs, and this one isn't.
- **Nothing seed-dependent is public before `revealed`.** Seating is shuffled from the seed, so it's unknown during betting; only the lineup, preset and odds are.
- **No in-play betting, by construction.** The match is fully determined the moment the seed is public, so any market open during playback is free money for anyone who runs the sim. The architecture forbids it; this isn't a feature left for later. Dynamic odds still exist: the parimutuel pool moves with every bet during `open`.
- The winner toast appearing after playback is UI politeness. A client with devtools open knows the winner at reveal and can do nothing with it.

## Realtime
- **SSE, not WebSockets.** Traffic is one-directional: the server announces, clients listen. A bet is a normal `POST`. WebSockets add a dependency and an upgrade handshake for a client channel that doesn't exist.
- **One event type, `state`, carrying the full snapshot**, sent on connect and on every phase transition. A reconnecting or late client gets everything in one message; there is no delta replay and no "did I miss `closed`?" logic. Plus a lighter `pool` event on each accepted bet.
- Snapshot: `{ matchId, phase, lineup, preset, odds, commitHash, opensAt, closesAt, pool: { total, byEntrant }, secret?, seed?, startAt?, winner? }`. Optional fields appear from `revealed` / `settled`. One function builds it; routes never assemble match state themselves.
- Implementation: `Content-Type: text/event-stream`, a `Set<Response>` of open streams, `res.write` per message, a comment line every ~20 s as heartbeat, proxy buffering off for `/stream`. The broadcaster is one function; if socket.io is ever wanted it's a one-file swap.

## Auth
- `POST /auth/register`, `POST /auth/login` → JWT. bcrypt for passwords.
- **`authEnforce` is mounted per router, not globally** (deviation from the course, which guards everything after `/auth`). `/stream`, `/matches`, `/matches/:id`, `/lineups` are public: a viewer without an account is still a viewer, and replays are the audit tool. `/bets` and `/me` require a token.
- A user is `name`, `password_hash`, `credits`. New accounts start with a fixed credit grant. That's the entire user model until item 8.

## Schema
- **users** `id, name UNIQUE, password_hash, credits INT, created_at`
- **lineups** `id, name, preset, entrants JSON, odds JSON, computed_at`
- **matches** `id, lineup_id, phase, commit_hash, secret, seed, opens_at, closes_at, start_at, winner, settled_at`
- **bets** `id, match_id, user_id, entrant, amount INT, payout INT NULL, created_at`, `UNIQUE(match_id, user_id)`, index on `match_id`
- Credits, amounts and payouts are integers. Never float money.
- `secret` and `seed` are stored from creation and **never leave the snapshot builder before `revealed`**. That rule lives in one place.
- Pool totals are `SUM(amount) GROUP BY entrant`; cheap at this scale, no denormalised counters.

## Settlement
- **Parimutuel.** The pool is split among winning bets pro-rata: `payout = floor(amount × pool / winningPool)`. No house line, no odds to set, self-balancing. The 10k win rates are shown as information next to the pool; they are not the price.
- One `sequelize.transaction`: compute winner, write `matches.winner`, write every `bets.payout`, credit users. All or nothing.
- `floor` leaves a remainder; the house keeps it. Draw and timeout refund every bet.
- Fixed odds from the 10k stats is the alternative if parimutuel feels thin with few bettors. Under Open.

## Deployment
- `docker compose up`: `postgres`, `backend`, `frontend`. Frontend is the course's multi-stage build: `node:alpine` builds `dist/`, `nginx:alpine` serves it. Matches the course layout exactly.
- **nginx is the front door.** It serves the SPA (`try_files $uri /index.html`) and proxies `/api/*` to the backend container, so the browser sees one origin. `cors()` is dev-only (Vite on one port, Express on another).
- **`/api/stream` needs `proxy_buffering off` and a long `proxy_read_timeout`** in the nginx config. nginx buffers proxied responses by default, which turns SSE into "nothing until the connection closes". This is the one place the realtime choice touches ops.
- `NODE_ENV=compose` config as in the course; `sequelize.sync()` on boot for now.

## Rejected
- **SQLite.** Correct at this scale (one process, few writes) and the fastest option below one node, but no CV value and the course uses Postgres. Named here so the reason is on record, not "SQLite doesn't scale".
- **Rust/axum backend.** The benchmark gains are real and irrelevant: the server's load is idle SSE connections plus one 5 ms match per interval, not request throughput. The real cost is a second sim implementation that must stay bit-identical with the TS one for replay to agree with settlement. Rust belongs in the sim as a WASM module shared by browser and server (see Roadmap).
- **socket.io.** Bidirectional transport for a broadcast. Emit-only socket.io would work; SSE is the right tool and "why not WebSockets" is the better interview question.
- **In-play betting.** Impossible under a deterministic sim with a public seed. See Fairness.
- **Duplicate entrant names in betting lineups.** See Freeze.

## Roadmap
1. ~~**Hull.**~~ Body + bow pentagon inside the tile, replacing the nose. Builder-only, tested like `buildShips`. *Done when* facing reads from the shape alone.
2. ~~**Dark mode.**~~ CSS variables for the page; a `Theme` object for the canvas (`FLOOR`, ring, storm text, label fill) passed through `drawWorld` opts. Default from `prefers-color-scheme`. *Done when* it's usable at night.
3. **Workspace split.** `sim/`, `frontend/`, `backend/` as npm workspaces; both apps import `@arena/sim`. *Done when* `npm test` and `npm run dev` work from the root and no app imports the other.
4. **React shell.** `main.ts` → `App` + `<Arena>` owning the canvas via a ref and constructing `Player`; `Player.turnEl` → `onFrame(turn)`. `render/` and `sim/` unchanged. Ships controls, winner toast, theme toggle, playback speed, **seed/preset in the URL with a copy link**. *Done when* a pasted link replays the same match.
5. **Backend: lobby.** Express + Postgres + compose. `GET /lineups`, `GET /matches/:id`, `GET /stream`; the scheduler running the lifecycle; odds precomputed on lineup insert. No accounts. *Done when* the client shows "next match in m:ss", then the match, from the stream alone.
6. **Auth.** register/login/JWT, `authEnforce` per router, `/me`. *Done when* a token gates `/bets` and nothing else.
7. **Predictions.** `POST /bets`, pool totals over SSE, settlement on reveal. *Done when* a bet placed before close pays out after the replay, and one placed after is refused.
   **→ Demo line.** Everything below is a second product.
8. **User bots.** A bot DSL compiled to `Brain`; never user code on the server. Bots are rows owned by users; a lineup can include them.
9. **User vs user.** A user-created lineup is a match whose entrants belong to users; credits on the line through the same settlement.
10. **Sim in Rust/WASM** (sim-side item; `DECISIONS.md` 15). One implementation shared by browser and server; training speed is the motive. The platform gains nothing it needs, only speed.

## Open
- Fixed odds vs parimutuel, once there's bettor data.
- Migrations instead of `sync()`. After first deployment.
- Scaling past one process: Postgres is already shared; needs Redis pub/sub for SSE fan-out and a single elected scheduler. All three arrive together; none are needed for one box.
- Replay history page (`/matches` list with winners) as the first thing after the demo line, since it's read-only and the data is already there.
