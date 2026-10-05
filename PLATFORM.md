# Platform decisions

The full-stack wrapper around the sim: a prediction market on bot matches. Same format as `DECISIONS.md` (what, why, what it takes to revisit). Sim and renderer decisions stay in `DECISIONS.md`; this file never changes a sim rule.

## Freeze
- **The sim is a dependency, not code the platform edits.** The apps reach it only through its package entries; see System design › Contracts.
- Rules work (DECISIONS roadmap 18+) continues in `DECISIONS.md`. 
- The sim seed stays 32-bit. The platform derives it from its own 256-bit secret (see Fairness); `makeRng`/`deriveSeed` are unchanged.
- Betting lineups use distinct entrant names (`showcase`-style, not `heldout`-style). A bet is on an entrant; duplicate names would make "chaserV2 wins" mean any of three seats. Revisit if a lineup needs duplicates: bet by name with aggregated odds.
- **Entrant names are immutable identities** once a deployment is kept: a behavior change gets a new name (a retrained brain is `reinforceV3`, never a new `reinforceV2`). Bets, matches and cached odds refer to the name, so it must always mean the same bot. The registry and DB use the short names; the UI may abbreviate. Until the first kept deployment there are no users and the DB is wiped freely.

## Architecture
- **One repo, npm workspaces:** `sim/` (`@arena/sim`: sim, evo, bots, CLIs, brains), `frontend/` (the Vite app; React shell from roadmap 4), `backend/` (Express; joins as a workspace at roadmap 5). Both apps depend on `@arena/sim`; nothing depends on an app.
- **The server never streams a match.** It publishes a match descriptor (System design › Match descriptor) and every client runs the sim locally, playing back by wall clock: `frame = (now − startAt) / FRAME_MS`. Everyone sees the same frame at the same instant, late joiners land on the right frame, and the server's cost per viewer is one idle connection. This is what determinism buys and it's the headline.
- **Live is a DVR**. Viewers can pause, rewind and step; stepping forward stops at the live frame (a UX cap, not security: bets are closed by then, and anyone can run ahead in devtools). Behind live shows a Live button that snaps back. Speed > 1× only until caught up. now is the server's clock: the client derives an offset from server time and uses now + offset, or countdowns and frames drift by the user's clock error.
- **The renderer is the audit tool.** Anyone can take a revealed seed, replay the match in the browser, and check the published result. No separate "verify" feature; the frontend already is one. `/matches/:id` serves the descriptor, the revealed secret and the stored result; the page checks `sha256(secret) === commitHash`, replays, and compares winners. That replaces roadmap 4's `?seed=` link, which carries no lineup or simVersion and can't be the trustless version. 
- **One backend process is the whole backend:** HTTP, SSE fan-out, and the match scheduler. Scaling past one process is under Open.

## Stack
- Express 5, Drizzle (`drizzle-orm` over a node-postgres `pg` Pool) on Postgres 18, drizzle-kit for SQL migration files, zod for request validation, `jsonwebtoken`, docker compose. Layout `routers/middlewares/models/db/config/errors/`, error chain `notFound → logError → errorResponder` (System design › Errors).
- **Config: Node env files validated by zod at boot.** `--env-file-if-exists` in dev; compose/platform inject in deployment; `parseEnv` validates once and the app reads the parsed `env`. Values come from whoever starts the process: in dev, the shell and then `backend/.env` (the file never overwrites a variable that's already set); in deployment, compose `environment:` or the platform (the image runs without the flag, so no file). zod defaults fill whatever is still unset. `NODE_ENV` only means development/production/test behavior; it never selects a file. Replaces the course's `config` package, and zod replaces Joi, so there is one validation library.
- **`DATABASE_URL` is one connection URL**, not separate parts, because that's what hosting platforms provide. Required, no default, validated by zod as a `postgres:`/`postgresql:` URL. Passwords in it must be URL-encoded. `backend/vitest.config.ts` gives the test runner a dummy one via `test.env`.
- **`cors` with an explicit allowed origin from env** (`CORS_ORIGIN`, validated by zod), never `*`. The browser talks to two origins, the frontend and the backend (Deployment).
- **The sim is a compiled package** (`sim/dist`, exports → dist; the `@arena/source` condition for dev/tests, System design › Contracts). The backend is built with tsc; `start` is `node --enable-source-maps dist/server.js` with no env file, so production env comes from whoever starts the process (Config). tsx is dev-only. Landed in roadmap 5 step 3e.
- **Modules: NodeNext for sim and backend.** Relative imports carry `.ts`; tsc rewrites them to `.js` on emit (`rewriteRelativeImportExtensions`). JSON imports use `with { type: 'json' }`. The frontend stays on bundler resolution; `moduleResolution: bundler` is explicit in `tsconfig.base.json` and sim/backend override it. Option (c), chosen over NodeNext with `.js` imports: same strictness, but one import style repo-wide and ready for Node type-stripping. Rejected: bundler resolution for Node-run code, too lenient (a missing extension or JSON import attribute only fails at runtime). Cheap to revisit.
- **Builds: a checker/builder tsconfig pair** in sim and backend. `tsconfig.json` type-checks everything including tests (`noEmit` from the base); `tsconfig.build.json` extends it and only adds emit settings and excludes. sim builds to `sim/dist` (`.js`, `.d.ts`, `.d.ts.map`), excluding tests, `src/test` and the CLIs (`src/*cli.ts`). backend builds to `backend/dist` (`.js` + source maps, no declarations). Every `build` script is `clean` (`node -e "fs.rmSync('dist', …)"`, because npm scripts run in cmd.exe on Windows, where `rm -rf` fails; `tsc --build --clean` was rejected because it doesn't remove stale outputs) then `tsc -p tsconfig.build.json`. Root `npm run build` is an explicit chain, sim → backend → frontend, instead of relying on the `workspaces` array order.
- **Node 24 LTS, pinned:** LTS for production; local had been on 25. `.nvmrc` = 24, root `engines.node` = 24, `node:24-alpine` in Docker.
- **The DB module does no I/O at import.** `src/db/client.ts` only creates the Pool and the drizzle instance. `server.ts` runs `select 1` before `listen`; on failure it logs the error and exits with code 1. `app.ts` never imports the db module, so unit tests don't need Docker.
- Chosen to match the course stack (jb-45800-5 betterx backend) so the platform reads as standard full-stack work. Deviations are called out where they happen (config and validation above, database and ORM below; Auth, Realtime, Deployment); nothing else is clever on purpose.
- **Postgres over MySQL** (the course used MySQL): stricter, JSONB and arrays fit the odds cache, and it's the industry default. Postgres 18, `postgres:18-alpine`, major pinned.
- **Drizzle over Sequelize and Prisma:** SQL-close queries; schema in plain TS (no codegen, no decorators); readable SQL migrations via drizzle-kit; fits the tsc/NodeNext pipeline. Prisma was considered (a codegen step, more abstraction). Sequelize was dropped (TS bolted on, decorators).

## System design

### Pieces
- **`@arena/sim`**: pure library. Rules, `step`, bots, brains. No I/O, no clock, no DOM, no network. Depends on nothing else in the repo.
- **`backend`**: the authority. Runs matches for real, persists anything that must be trusted.
- **`frontend`**: the viewer. Replays matches and owns everything that's only for display.
- Dependencies point one way: apps → sim. Never sim → app, never app ↔ app. Enforced by the sim's `exports` map (no deep imports resolve) and the sim's tsconfig having no `DOM` lib.

### Contracts
1. **Sim public API**: the entries in `sim/package.json` `exports` — `@arena/sim` (core), `@arena/sim/bots` (lineups, bots, brains), `@arena/sim/testing` (fixtures, tests only). The barrel files (`sim/src/index.ts`, `sim/src/roster.ts`) *are* the contract; this file never copies their contents. Anything not exported can't be imported. Adding an export is free; changing or removing one breaks both apps and gets a line here and in `DECISIONS.md`.
   - **Exports map: src → dist** (roadmap 5 step 3e). Chosen so the backend image runs plain `node` and to learn how a production package builds; tsx everywhere and bundling the backend were the alternatives. Each subpath maps conditions in this order: `@arena/source` → `src/*.ts`, `types` → `dist/*.d.ts`, `default` → `dist/*.js`. The source condition keeps Vite, Vitest and tsc on `src/`; chosen over running `tsc -w` in dev: dev and tests never need a built sim. Entry names and exports are unchanged; only what they resolve to changed.
   - **`./testing` is source-only** (only `@arena/source`): resolvable in dev and tests, deliberately unresolvable in production, which makes it the production guard.
   - **Who holds the condition:** `customConditions` in `tsconfig.base.json`; `frontend/vite.config.ts` (`resolve.conditions` and `ssr.resolve.conditions`, with Vite's defaults spread in); `sim/vitest.config.ts` and `backend/vitest.config.ts` (`ssr.resolve.conditions`). Root Vitest config settings don't propagate into projects, so each project sets its own.
   - Added (free): `seedFromSecret` in core; `entrant`, `isEntrantName`, `EntrantName` in `./bots`.
2. **Backend ↔ frontend**: HTTP for request/response, SSE for server → client pushes (schedule, seed reveal, result). No WebSockets. Shapes TBD at roadmap 5.

### Ownership
- Backend: seeds (secret until bets close), results, bets, balances, schedule, bot registry.
- Frontend: camera, theme, playback, URL state.
- The server's run of a match **is** the result. A browser replay is a display of it; nothing the frontend computes is trusted.

### Errors
- `HttpError` (`status` + `message`) is the only error whose message reaches a client. Anything else is a 500 with a generic message; the real error goes to the log (`logError`).
- One JSON shape for every error: `{ message }`.
- `notFound` is a normal middleware after the last route that passes a 404 `HttpError` on; `logError` and `errorResponder` are the two error middlewares behind it.

### Match descriptor
`{ seed, lineup, preset, startAt, simVersion }`. `seed` is derived from the revealed secret (Fairness); `startAt` is the wall-clock time of frame 0 (Match lifecycle); the lineup is entrant names, each pinned to one behavior (Freeze: names are immutable identities).
- It fully determines the match because there are no live inputs; bots decide everything. So no frames go over the wire: the browser re-runs the match (~1 ms) and gets the identical history.
- The server sends the descriptor plus its stored result; the browser compares. A mismatch means version drift and is shown as an error, not silently replayed.
- No in-play betting, by design. It's what keeps the descriptor sufficient. Revisit: any live input (a human-controlled ship, mid-match events) moves to server-authoritative snapshots.

### Open
- **Sim versioning.** Determinism only holds for identical code; any behavior change to `step` or a bot changes old replays. Need: what `simVersion` is (manual bump on behavior change vs git hash), and what happens to old matches. Cheapest: always store the result (settlement never depends on re-simulation) and offer replays only when the version matches the current one. Candidate: version in sim/package.json (now 0.1.0), bumped by hand on behavior change.


## Match lifecycle
- One **public** match at a time, driven by a scheduler in the backend process. The next match is `scheduled` during the current match's playback, so two rows are alive: one public, one scheduled.

  | phase | on entry | published |
  |---|---|---|
  | `scheduled` | row created during the previous match's playback: lineup drawn, odds looked up, `secret` generated, `commitHash` stored, `simVersion` recorded | nothing |
  | `open` | at `opensAt` | lineup, preset, simVersion, odds, `commitHash`, `closesAt`; bets accepted |
  | `closed` | at `closesAt` | bets refused; pool frozen |
  | `revealed` | immediately after close | `secret`, derived `seed`, `startAt = now + lead`; clients replay |
  | `settled` | server runs `playMatch`, pays out in one transaction | `winner`, payouts |

- `closed → revealed` is immediate; the gap exists only so "bets are closed" and "here is the seed" are two events, never one.
- `startAt` is a few seconds after reveal so clients can fetch and prepare before frame 0.
- Lineups are **random distinct names from the entrant registry**, not a curated table. `showcase` and `heldout` stay hardcoded in the sim for tournaments; the platform doesn't use them.
- Odds are cached per sorted name set + preset and computed on a miss (`runTournament`, 1–2k matches, ~1–2 s at ~1000 matches/s for 11 seats). 1–2k is enough because under parimutuel the odds are display information, not the price (Settlement).
- `winner` is an entrant name, or `draw` / `timeout` (both refund), classified by `outcome(final)` from the core entry, the same function the tournament and the viewer use.

## Fairness
- **Commit-reveal.** At `scheduled` the server generates `secret = randomBytes(32)` and stores `commitHash = sha256(secret)`. The hash is public from `open`. After `closed` the secret is published; clients check `sha256(secret) === commitHash` and derive the same seed.
- Sim seed = first 4 bytes of `secret`, big-endian, unsigned, via `seedFromSecret` in `@arena/sim`, so backend and browser derive it identically. Hashing stays out of the sim (Node `crypto` vs async Web Crypto).
- **Why 32 bytes and not the sim's 32-bit seed.** `makeRng` takes 32 bits. Committing `sha256(seed)` of a 32-bit value is brute-forceable (4 billion hashes) before bets close. The secret has 256 bits of entropy; the sim seed is derived from it (first 4 bytes). No salt, no key: salting protects low-entropy inputs, and this one isn't.
- **Nothing seed-dependent is public before `revealed`.** Seating is shuffled from the seed, so it's unknown during betting; only the lineup, preset and odds are.
- **No in-play betting, by construction.** The match is fully determined the moment the seed is public, so any market open during playback is free money for anyone who runs the sim. The architecture forbids it; this isn't a feature left for later. Dynamic odds still exist: the parimutuel pool moves with every bet during `open`.
- the result shown at the end of playback is UI politeness. A client with devtools open knows the winner at reveal and can do nothing with it.
- Known limit: the server could grind secrets for an outcome it likes. Not a concern under parimutuel with play money; a client seed or outside entropy would close it.

## Realtime
- **SSE, not WebSockets.** Traffic is one-directional: the server announces, clients listen. A bet is a normal `POST`. WebSockets add a dependency and an upgrade handshake for a client channel that doesn't exist.
- **One event type, `state`, carrying the full snapshot**, sent on connect and on every phase transition. A reconnecting or late client gets everything in one message; there is no delta replay and no "did I miss `closed`?" logic. Plus a lighter `pool` event on each accepted bet.
- Snapshot: `{ matchId, phase, lineup, preset, simVersion, odds, commitHash, opensAt, closesAt, pool: { total, byEntrant }, secret?, seed?, startAt?, winner? }`. Optional fields appear from `revealed` / `settled`. One function builds it; routes never assemble match state themselves.
- Implementation: `Content-Type: text/event-stream`, a `Set<Response>` of open streams, `res.write` per message, a comment line every ~20 s as heartbeat, proxy buffering off for `/stream` if a reverse proxy sits in front (Deployment). The broadcaster is one function; if socket.io is ever wanted it's a one-file swap.
- **`/stream` is cross-origin.** `EventSource` is subject to CORS like `fetch`, so `/stream` responses need the CORS header too; the global `cors()` middleware covers it. `EventSource` can't send custom headers, which is fine because the stream is public. If it ever needs auth: cookies + `withCredentials` + a specific allowed origin, never `*`.

## Auth
- `POST /auth/register`, `POST /auth/login` → JWT. bcrypt for passwords.
- **`authEnforce` is mounted per router, not globally** (deviation from the course, which guards everything after `/auth`). `/stream`, `/matches`, `/matches/:id`, `/lineups` are public: a viewer without an account is still a viewer, and replays are the audit tool. `/bets` and `/me` require a token.
- A user is `name`, `password_hash`, `credits`. New accounts start with a fixed credit grant. That's the entire user model until item 8.

## Schema
- **users** `id, name UNIQUE, password_hash, credits INT, created_at`
- **lineups** `id, name, preset, entrants JSON, odds JSON, computed_at`
- **matches** `id, lineup_id, phase, commit_hash, secret, seed, opens_at, closes_at, start_at, winner, settled_at, sim_version`
- **bets** `id, match_id, user_id, entrant, amount INT, payout INT NULL, created_at`, `UNIQUE(match_id, user_id)`, index on `match_id`
- Credits, amounts and payouts are integers. Never float money.
- `secret` and `seed` are stored from creation and **never leave the snapshot builder before `revealed`**. That rule lives in one place.
- Pool totals are `SUM(amount) GROUP BY entrant`; cheap at this scale, no denormalised counters.

## Settlement
- **Parimutuel.** The pool is split among winning bets pro-rata: `payout = floor(amount × pool / winningPool)`. No house line, no odds to set, self-balancing. The cached win rates (Match lifecycle) are shown as information next to the pool; they are not the price.
- One `db.transaction`: compute winner, write `matches.winner`, write every `bets.payout`, credit users. All or nothing.
- `floor` leaves a remainder; the house keeps it. Draw and timeout refund every bet.
- Fixed odds from the 10k stats is the alternative if parimutuel feels thin with few bettors. Under Open.

## Deployment
- `docker compose up` (root `compose.yaml`): `postgres` and `backend` now, `frontend` to come. Frontend is the course's multi-stage build: `node:24-alpine` builds `dist/`, `nginx:alpine` serves it. One deviation from the course: both images build with the **repo root as context** (`context: .`, `dockerfile: <app>/Dockerfile`), because each needs `sim/`. The frontend image carries no sim at runtime (Vite bundles it into the JS).
- **`backend/Dockerfile`, multi-stage**: about 200 MB smaller, no compiler or devDependencies in the production image. Built from the repo root: `docker build -f backend/Dockerfile -t arena-backend .`. Build stage: full `npm ci`, then builds sim then backend with `-w`. Runtime stage: `NODE_ENV=production`, `npm ci --omit=dev -w @arena/sim -w @arena/backend`, `COPY --from=build` both dist folders, `USER node`, and `CMD` runs `node` directly so PID 1 receives SIGTERM.
- **Root `.dockerignore`:** `**/node_modules`, `**/dist`, `**/.env`, `**/runs`, `.git`.
- **Compose services.** `postgres`: named volume `pgdata` at `/var/lib/postgresql` (the Postgres 18 path), `pg_isready` healthcheck, port 5432 published. `backend`: built from the root context, `DATABASE_URL` with host `postgres`, `depends_on` with `condition: service_healthy`, port 3000.
- **Dev workflow: DB in compose, backend on the host.** Compose runs only Postgres (`docker compose up -d postgres`); the backend runs with `tsx watch` and `backend/.env` (a `localhost` URL). The full stack (`docker compose up -d --build`) is the production check.
- **Two origins.** nginx serves the SPA only (`try_files $uri /index.html`) and doesn't proxy the API. The backend publishes its own port (3000, on the host in dev and in compose) and gets its own subdomain later (prod). Routes are bare: `/health`, `/lineups`, `/matches/:id`, `/stream`.
- **The frontend finds the backend through `VITE_API_URL`**, set in `.env.development` / `.env.production`. Vite inlines it at build time, so the frontend image is built per environment (a build arg in the Dockerfile), the same as the course's `.env.docker` / `.env.production`. Every API call goes through one module that reads it.
- **If a reverse proxy sits in front of the backend in prod, `/stream` needs `proxy_buffering off` and a long `proxy_read_timeout` there.** nginx-style proxies buffer responses by default, which turns SSE into "nothing until the connection closes". Compose has nothing in front of the backend, so this applies only once a proxy is added. This is the one place the realtime choice touches ops.
- Env comes from compose `environment:` (Stack › Config). Schema changes ship as drizzle-kit SQL migrations (Stack).

## Rejected
- **SQLite.** Correct at this scale (one process, few writes) and the fastest option below one node, but no CV value. Named here so the reason is on record, not "SQLite doesn't scale".
- **Rust/axum backend.** The benchmark gains are real and irrelevant: the server's load is idle SSE connections plus one 5 ms match per interval, not request throughput. The real cost is a second sim implementation that must stay bit-identical with the TS one for replay to agree with settlement. Rust belongs in the sim as a WASM module shared by browser and server (see Roadmap).
- **socket.io.** Bidirectional transport for a broadcast. Emit-only socket.io would work; SSE is the right tool and "why not WebSockets" is the better interview question.
- **In-play betting.** Impossible under a deterministic sim with a public seed. See Fairness.
- **Duplicate entrant names in betting lineups.** See Freeze.
- **One origin via a reverse proxy** (nginx in deployment and the Vite dev proxy forwarding API routes to the backend). It saves CORS and the per-environment API URL, at the cost of proxy config. Declined in favor of the course-style two-origin setup.

## Roadmap
1. ~~**Hull.**~~ Body + bow pentagon inside the tile, replacing the nose. Builder-only, tested like `buildShips`. *Done when* facing reads from the shape alone.
2. ~~**Dark mode.**~~ CSS variables for the page; a `Theme` object for the canvas (`FLOOR`, ring, storm text, label fill) passed through `drawWorld` opts. Default from `prefers-color-scheme`. *Done when* it's usable at night.
3. ~~**Workspace split.**~~ `sim/` and `frontend/` as npm workspaces; `@arena/sim` with entries `.`, `./bots`, `./testing`; shared `tsconfig.base.json`, sim without `DOM`; Vitest projects at the root. `backend/` joins at 5.
4. ~~**React shell.**~~ `main.ts` → `App` + `<Arena>` owning the canvas via a ref and constructing `Player`; `Player.turnEl` → `onFrame(turn)`. `render/` and `sim/` unchanged. Ships controls, winner toast, theme toggle, playback speed, **seed/preset in the URL with a copy link**. *Done when* a pasted link replays the same match. Shipped: `App` reads `?seed=&preset=` (or picks a crypto seed and writes it back), `useMatch` → `<Arena match>`; controls, theme toggle (useTheme), speed, copy link. The winner toast became a result derived during render (no toast library). The `?seed=` link is a stand-in until `/matches/:id`.
5. **Backend: lobby.** Express + Postgres + compose. `GET /lineups`, `GET /matches/:id`, `GET /stream`; the scheduler running the lifecycle; odds cached per name set + preset. No accounts. *Done when* the client shows "next match in m:ss", then the match, from the stream alone. Adds what the backend needs to the core entry: `runTournament` (odds), `seedFromSecret`, and whatever the scheduler calls.
   - ~~**Step 1.**~~ `seedFromSecret` in core.
   - ~~**Step 2.**~~ Entrant registry (`entrants.ts`, exported from `./bots`); lineups built from names.
   - ~~**Step 3.**~~ Backend skeleton: zod-validated env, health route, error chain, tests (supertest in-process).
   - ~~**Step 3d.**~~ JSON error chain with `HttpError` (System design › Errors).
   - ~~**Step 3e. Sim build.**~~ `sim/dist` and `backend/dist` via tsc; exports map → dist with a source condition for dev/tests. *Done when* `npm run build` produces both, `node backend/dist/server.js` serves `/health`, and frontend dev and all tests run without a manual sim build. Shipped: NodeNext + `.ts` imports in sim and backend, checker/builder tsconfig pairs, clean-then-tsc build scripts, root chain sim → backend → frontend (Stack).
   - **Step 4. Compose + Postgres.** ~~Infra~~: `backend/Dockerfile`, compose with `postgres` + `backend`, `DATABASE_URL`, Drizzle connection, Node 24 pin (Stack, Deployment). Next: `lineups` (odds cache) + `matches` schema, drizzle-kit config, first migration.
   - **Step 5. Random lineups + odds cache.** When the backend first imports the sim: `--conditions=@arena/source` for tsx in the backend dev script; verify the backend vitest `ssr` block; hover-check that types from `sim/dist/*.d.ts` aren't `any` (`skipLibCheck` would hide broken `.d.ts` imports).
   - Then: 6 scheduler + snapshot builder, 7 SSE + `/lineups`, `/matches/:id`, 8 frontend on the stream through the `VITE_API_URL` module. `cors` + `CORS_ORIGIN` land at 4 or when the frontend first calls the API, whichever comes first.
6. **Auth.** register/login/JWT, `authEnforce` per router, `/me`. *Done when* a token gates `/bets` and nothing else.
7. **Predictions.** `POST /bets`, pool totals over SSE, settlement on reveal. *Done when* a bet placed before close pays out after the replay, and one placed after is refused.
   **→ Demo line.** Everything below is a second product.
8. **User bots.** A bot DSL compiled to `Brain`; never user code on the server. Bots are rows owned by users; a lineup can include them.
9. **User vs user.** A user-created lineup is a match whose entrants belong to users; credits on the line through the same settlement.
10. **Sim in Rust/WASM** (sim-side item; `DECISIONS.md` 21). One implementation shared by browser and server; training speed is the motive. The platform gains nothing it needs, only speed.

## Open
- Fixed odds vs parimutuel, once there's bettor data.
- **Draws at 12%** with the brain-heavy 11-seat showcase (DECISIONS › Tournament findings): about 1 match in 8 refunds. The fix is a rules change (storm finish / tie-break), later and sim-side; until then refunds are the cost.
- Scaling past one process: Postgres is already shared; needs Redis pub/sub for SSE fan-out and a single elected scheduler. All three arrive together; none are needed for one box.
- Replay history page (`/matches` list with winners) as the first thing after the demo line, since it's read-only and the data is already there.
- **Small debts:**
  - sim `types: ["node"]` applies to the whole sim, including the core that ships to the browser.
  - Training code (evaluate/evolve/fitness/`PolicyBrain`/policy) ships in `sim/dist`.
  - `logError` prints full stacks for ordinary 404s, and prints during tests. Fix: log `HttpError`s briefly, full trace only for unexpected errors.
  - Compose credentials are written twice (`POSTGRES_*` and the backend's `DATABASE_URL`). Later: root `.env` interpolation.
  - The backend has no ESLint.
  - body-parser errors become 500s.
