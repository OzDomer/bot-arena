# Decisions

Each entry: what we decided, why, and what it would take to revisit.

## Architecture
- **Pure sim, separate renderer.** `step(world, actions) → world`, no DOM, no mutation. Enables replay, headless tournaments, tests, and any future renderer (3D, Node, another language). Revisit: never.
- **Brain interface.** `decide(Readonly<Observation>) → Action`. The one slot every bot type plugs into. Bots get copies, never world references. `Readonly<>` is documentation; the copies in `observe` are the guarantee.
- **Worlds are immutable after creation.** Unmoved ships share position objects across frames; that's fine only because nothing writes into them. Never mutate a world.
- **Rules object.** All tunables in `Rules`; `World.rules` points at it. Per-match randomized setup (storm center) lives on `World`; anything derivable from turn + rules is a function, not state.
- **Seeded RNG, one stream per purpose** — world, seat shuffle, and each bot — all derived from the match seed. Changing one bot's randomness can't perturb another's, and independent things stay independent (see findings: a shared stream correlated seating with spawns). Current derivation is `seed + offset`, which is fragile; replace with `deriveSeed(seed, purpose, index)` before evolution.
- **Observation is what a player sees, not the world.** `map` exposes only width, height and turn — not `Rules`. Storm damage is deliberately hidden; a bot (hand-written or learned) has to infer that the storm hurts and how badly. Revisit: if evolved brains can't learn it, expose damage and note why.
- **`Hit` is ship-on-ship only** (`attacker`, `target`, `amount`). Widen to a `source` union when storm or pickups need attribution.
- **`step` returns only the world.** `runMatch` recomputes `resolveAttacks` for the stats callback; the duplication is pure and cheap. Revisit when `step` needs to emit an event log (RL rewards, storm attribution).
- **Stats are raw sums.** `damageDealt` is uncapped (no overkill split, which would need a turn-order rule); averages are computed at print time. Kill credit is shared by every attacker who hit on the death tick; a storm finish still credits the attackers. Revisit with `resolveStorm`.
- **Sample size.** 1k matches → identical bots spread ±2pp; 10k → ±0.6pp. Balance claims need 10k. Headless: 10k matches ≈ 4 s in Node (~2,500 matches/s, ~500k `step()`/s).

## Rules (v1)
- **Chebyshev distance** for vision and attack — matches 8-direction movement. (Manhattan caused diagonal chasers to swap tiles forever.)
- **Attacks resolve before moves**, on start-of-tick positions and facing. Turning happens during the move phase, after combat.
- **Simultaneous damage** via a tally, so array order never gives initiative.
- **Dead ships stay** as wrecks and block tiles.
- **One ship per tile.** Wrecks, stayers and clamped moves claim first; movers resolve in id order (lower id wins — known bias, washed out by random seating); swaps bounce both; bounces cascade until stable. Ships are solid: no passing through each other. (Ramming later.)
- **Facing = last move direction.** No rotate action. A bounced move still turns the ship. Rear hits ×2, side/front ×1.
- **Storm:** circle, center fixed at map center for now (randomize per match later), radius shrinks one tile per phase after `startTurn`, damage `baseDamage × phase`, applied after moves, whole map is storm once radius goes negative (floors at −1). Bots see the storm as a player would: center, radius and phase, never the damage number.
- **Last one standing wins.** 0 alive = draw, >1 at turn cap = timeout.

## Rejected
- Damage RNG (luck, not skill). Move-XOR-attack (kills the RTS feel). Bracing (rewards camping). Bot "retry" on blocked move (breaks the GM model; bots can see the tile is taken). Coward v2 with storm awareness (its problem is the flee trigger, not the storm — replaced by the Kiter). Capping `damageDealt` at remaining HP (needs an arbitrary overkill split).

## Roadmap
1. ~~Storm~~ (center-fixed; randomize center later)
2. ~~Tournament stats~~ (per-seat, random seating, headless `npm run tournament`)
3. ~~Narrow Observation~~
4. ~~Collision fix~~ (solid ships, cascading bounces)
5. `deriveSeed(seed, purpose, index)` — replace `seed + offset` derivation
6. Opponent pool: storm-aware Chaser v2, Camper, Kiter (Coward v1 frozen as baseline)
7. Heal resource
8. Evolution (tiny NN brains), then RL
9. Port `step()` to Rust — to learn Rust, not for speed
10. RTS: momentum physics, continuous positions, islands, ramming, disembarking; re-evolve

## Tournament findings
- Identical-stat shooters always draw 1v1 → needed asymmetry → facing.
- Free-for-all: random beat chaser ~3:1 before facing; aggression is punished when there's no reason to fight.
- Chaser vs coward: 35% timeouts (two cowards fleeing each other forever) → justifies the storm.
- Storm (v1, center-fixed): timeouts 35% → 0 in 100 matches, draws ~9%. Tally by name was chaser 48 / coward 43, but the lineup was 3 chasers vs 4 cowards — per seat chaser still wins ~16 vs ~11. → The "coward wins the wait" read was wrong; see below.
- Per-seat stats, 1000 matches, random seating: chaser ~15.7% wins per seat, coward ~10.9%. Average survival is the same for both (~19 turns), but the coward deals half the damage and gets a third of the kills. Fleeing at 45% HP with range-1 attacks just turns its rear to an adjacent enemy. Its ~11% wins are the matches where spawn and wander randomness leave it standing last, not a strategy paying off.
- Collision bug (ships could share a tile after a bounce) fixed. Same seed, 1000 matches: chaser survival +20%, draws −21%, win rates within noise. Coward conclusion unchanged.
- At 10k matches one of four identical cowards won 11.25% vs ~10.0% for the others — ~4σ. Cause: the seat shuffle and the spawn RNG were built from the same seed, so seat order and spawn positions were the same random sequence. Giving the shuffle its own stream put all four at 10.3–10.6%. Lesson: "one RNG stream per purpose" isn't just for reproducibility, it's for not correlating things that must be independent.
- Current baseline (10k, seed 1790266907455): chaser 17.1% per seat, coward 10.4%, draws 6.8%.