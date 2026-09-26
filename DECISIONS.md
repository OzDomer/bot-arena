# Decisions

Each entry: what we decided, why, and what it would take to revisit.

## Architecture
- **Pure sim, separate renderer.** `step(world, actions) → world`, no DOM, no mutation. Enables replay, headless tournaments, tests, and any future renderer (3D, Node, another language). Revisit: never.
- **Brain interface.** `decide(Readonly<Observation>) → Action`. The one slot every bot type plugs into. Bots get copies, never world references. `Readonly<>` is documentation; the copies in `observe` are the guarantee.
- **Worlds are immutable after creation.** Unmoved ships share position objects across frames; that's fine only because nothing writes into them. Never mutate a world.
- **Rules object.** All tunables in `Rules`; `World.rules` points at it. Per-match randomized setup (storm center) lives on `World`; anything derivable from turn + rules is a function, not state.
- **Seeded RNG, one stream per purpose** — world, seat shuffle, and each bot — all derived from the match seed via `deriveSeed(seed, purpose, index)`. Changing one bot's randomness can't perturb another's, and independent things stay independent (see findings: a shared stream correlated seating with spawns).
- **Observation is what a player sees, not the world.** `map` exposes only width, height and turn — not `Rules`. Storm damage is deliberately hidden; a bot (hand-written or learned) has to infer that the storm hurts and how badly. Revisit: if evolved brains can't learn it, expose damage and note why.
- **`Hit` is ship-on-ship only** (`attacker`, `target`, `amount`). Widen to a `source` union when storm or pickups need attribution.
- **`step` returns only the world.** `runMatch` recomputes `resolveAttacks` for the stats callback; the duplication is pure and cheap. Revisit when `step` needs to emit an event log (RL rewards, storm attribution).
- **Stats are raw sums.** `damageDealt` is uncapped (no overkill split, which would need a turn-order rule); averages are computed at print time. Kill credit is shared by every attacker who hit on the death tick; a storm finish still credits the attackers. Revisit with `resolveStorm`.
- **Kills/match > deaths/match.** Shared kill credit on the death tick inflates the count (7.7 on a 7-ship map with max 6 deaths). Fine as a relative measure across rulesets; don't read the absolute number. Fix when comparing bots, not rules.
- **Sample size.** 1k matches → identical bots spread ±2pp; 10k → ±0.6pp. Balance claims need 10k. Headless: 10k matches ≈ 4 s in Node (~2,500 matches/s, ~500k `step()`/s).
- **Rules presets.** `PRESETS` in `sim/presets.ts` is a `Record<PresetName, Rules>`, each spreading `DEFAULT_RULES` and overriding only what changes. CLI takes the name as argv[4]; `runTournament` threads it to `makeMatch`. Presets are data, not functions — no derivation of storm timing from map size (rejected, see findings: startTurn barely matters, so there's nothing worth deriving). Presets are the experiment record: don't overwrite one with another.

## Rules (v1)
- **Chebyshev distance** for vision and attack — matches 8-direction movement. (Manhattan caused diagonal chasers to swap tiles forever.)
- **Attacks resolve before moves**, on start-of-tick positions and facing. Turning happens during the move phase, after combat.
- **Attacks can be initiated from all sides**, a player can attack any tile aslong as they are in range.
- **Simultaneous damage** via a tally, so array order never gives initiative.
- **Dead ships stay** as wrecks and block tiles.
- **One ship per tile.** Wrecks, stayers and clamped moves claim first; movers resolve in id order (lower id wins — known bias, washed out by random seating); swaps bounce both; bounces cascade until stable. Ships are solid: no passing through each other. (Ramming later.)
- **Facing = last move direction.** No rotate action. A bounced move still turns the ship. Rear hits ×2, side/front ×1.
- **Storm:** circle, center fixed at map center for now (randomize per match later), radius shrinks one tile per phase after `startTurn`, damage `baseDamage × phase`, applied after moves, whole map is storm once radius goes negative (floors at −1). Bots see the storm as a player would: center, radius and phase, never the damage number.
- **Last one standing wins.** 0 alive = draw, >1 at turn cap = timeout.
> v1 = 10×10, storm start 20 / shrink 10. Superseded by v2 (20×20, shrink 5) after the rules experiments below. All findings before "Rules experiments" were measured under v1.

## Rules (v2)
- 20×20, `shrinkEvery` 5, everything else as v1. Chosen for strategy differentiation (V2−v1 gap 9.3pp vs 1.1pp on v1) and lower draw rate (4.7% vs 7.5%), with one knob changed from v1 instead of two. Storm closes fully before the turn cap; no timeouts.
- Invoked as preset `bigmap`. `DEFAULT_RULES` stays v1 because `step.test.ts` positions assume 10×10; flip it (and pin the fixtures to a `RULES_V1`) when v2 is settled enough to be worth the churn.


## Rejected
- Damage RNG (luck, not skill). Move-XOR-attack (kills the RTS feel). Bracing (rewards camping). Bot "retry" on blocked move (breaks the GM model; bots can see the tile is taken). Coward v2 with storm awareness (its problem is the flee trigger, not the storm — deferred until heals — see roadmap). Capping `damageDealt` at remaining HP (needs an arbitrary overkill split).
- Deriving storm timing from map size (`startTurn` barely matters on 20×20; nothing worth deriving — presets stay plain data).

## Roadmap
1. ~~Storm~~ (center-fixed; randomize center later)
2. ~~Tournament stats~~ (per-seat, random seating, headless `npm run tournament`)
3. ~~Narrow Observation~~
4. ~~Collision fix~~ (solid ships, cascading bounces)
5. ~~`deriveSeed(seed, purpose, index)`~~ — replace `seed + offset` derivation
6. ~~Storm-aware Chaser v2~~
7. ~~Rules presets + CLI arg~~ → v2 = 20×20, shrink 5 (preset `bigmap`). Storm-timing derivation rejected. Experiments in findings.
8. ~~Camper~~ — under v2
9. ~~Pairwise round-robin~~ → decide if evolution is justified
10. Heal resource
11. Kiter — keep threats at distance 2, retreat toward center not away from threat, face-and-trade when caught (move into the adjacent enemy = bounce-turn, see findings). Deferred: kiting buys time, and time is worthless without a resource to spend it on. Needs heals first.
12. Evolution — **in progress.** Linear net plateaus at "survive first" (findings). Next: fitness reweight, then hidden layer.
13. Parallel evaluation — worker_threads, one worker per core, population split into chunks. ~10 s/gen at 500 matches; the bottleneck now.
14. Port step() to Rust — was "to learn Rust, not for speed"; at 25k matches/gen it's both.
15. RTS: momentum physics, continuous positions, islands, ramming, disembarking; re-evolve

## Tournament findings
- Identical-stat shooters always draw 1v1 → needed asymmetry → facing.
- Free-for-all: random beat chaser ~3:1 before facing; aggression is punished when there's no reason to fight.
- Chaser vs coward: 35% timeouts (two cowards fleeing each other forever) → justifies the storm.
- Storm (v1, center-fixed): timeouts 35% → 0 in 100 matches, draws ~9%. Tally by name was chaser 48 / coward 43, but the lineup was 3 chasers vs 4 cowards — per seat chaser still wins ~16 vs ~11. → The "coward wins the wait" read was wrong; see below.
- Per-seat stats, 1000 matches, random seating: chaser ~15.7% wins per seat, coward ~10.9%. Average survival is the same for both (~19 turns), but the coward deals half the damage and gets a third of the kills. Fleeing at 45% HP with range-1 attacks just turns its rear to an adjacent enemy. Its ~11% wins are the matches where spawn and wander randomness leave it standing last, not a strategy paying off.
- Collision bug (ships could share a tile after a bounce) fixed. Same seed, 1000 matches: chaser survival +20%, draws −21%, win rates within noise. Coward conclusion unchanged.
- At 10k matches one of four identical cowards won 11.25% vs ~10.0% for the others — ~4σ. Cause: the seat shuffle and the spawn RNG were built from the same seed, so seat order and spawn positions were the same random sequence. Giving the shuffle its own stream put all four at 10.3–10.6%. Lesson: "one RNG stream per purpose" isn't just for reproducibility, it's for not correlating things that must be independent.
- Fully independent streams: chaser 17.2% per seat (16.8–17.5), coward 10.4% (10.2–10.8), draws 6.7% (reset after deriveSeed).
- Chaser v2 (heads to center when outside radius−1). Replacing v1: 18.5% per seat vs 17.2%. v1 and v2 in the same lineup, 10k: v2 14.1%, v1 13.0% — real (~4σ) but small. Survival turns identical, so the gain is from converging on the survivors, not from dodging damage. Margin 0 vs 1: no measurable difference. Under default rules the storm can't touch anyone before turn 50; combat has settled most matches by then. → Rules experiments next.
- **Rules experiments** (10k matches, seed 1790266907455, lineup 3×chaserV2 / 3×chaser / 1×coward, per-seat win %):

  | ruleset | draws | V2 / v1 / coward | V2−v1 | survival (V2) | timeouts |
  |---|---|---|---|---|---|
  | 10×10 default (20/10) | 7.5 | 14.1 / 13.0 / 11.3 | 1.1 | 17 | 0 |
  | 10×10 fast (5/5) | 7.2 | 15.1 / 12.2 / 10.8 | 2.9 | 12 | 0 |
  | 20×20 default (20/10) | 3.3 | 17.5 / 10.8 / 11.8 | 6.7 | 42 | 7 |
  | 20×20 fast start (5/10) | 3.6 | 17.8 / 10.5 / 11.4 | 7.3 | 40 | 0 |
  | 20×20 fast shrink (20/5) | 4.7 | 18.8 / 9.5 / 10.6 | 9.3 | 32 | 0 |
  | 20×20 both (5/5) | 5.1 | 19.3 / 8.9 / 10.1 | 10.4 | 28 | 0 |

  (storm columns are startTurn / shrinkEvery)
- Map size is the lever, storm timing is a dial on top. Doubling the map halves draws (spawns aren't on top of each other) and cuts kills/match 7.7 → 6.0 — the "spawn-forced fights" question answered yes.
- The V2−v1 gap tracks storm pressure monotonically: 1.1 → 2.9 → 6.7 → 10.4. Survival is nearly identical (v1 isn't dying to the storm much earlier); on 20×20 with vision 3, random wander rarely finds anyone, and V2's head-to-center doubles as a *finding* strategy. The storm is doing more work as a convergence rule than as damage.
- On 20×20, `shrinkEvery` is the knob and `startTurn` is noise (+2.6pp gap vs +0.6). Effects are additive, not interacting. Halving shrink doubles closing speed *and* the damage ramp; starting 15 turns earlier on radius 20 is 1.5 tiles. `startTurn` was never split out on 10×10.
- Coward is storm-insensitive: 11.3 / 10.8 / 11.8 / 11.4 / 10.6 / 10.1 across all six. It "beat v1" on 20×20 only because v1 fell past it. Same lesson as the earlier "coward wins the wait" misread: check whether the thing moved or the thing next to it moved.
- 10×10 fast storm compresses the clock (survival 17 → 12) without changing who wins — damage dealt within 1% of default. Combat settles before the storm on the small map regardless of timing.
- **Camper v1** (8-seat lineup: 3×chaserV2 / 3×chaserV1 / camper / coward, 10k, seed 1790266907455, bigmap). Lineup changed, so numbers aren't comparable to the 7-seat runs above; ×baseline (1/8) is what carries across.

  | | win % | ×baseline | survival | dmg dealt | dmg taken |
  |---|---|---|---|---|---|
  | chaserV2 | 15.8 | 1.26 | 33 | 90.6k | 85.6k |
  | camperV1 | 14.8 | 1.18 | 27 | 72.9k | 93.8k |
  | chaserV1 | 7.2 | 0.58 | 30 | 97k | 83.7k |
  | coward | 6.5 | 0.52 | 28 | 60.4k | 94.5k |
  | draws | 9.6% | | | | |

- Camper is strong, not degenerate. Pre-declared tell for "outlasting on the safe tile" was high survival + low damage; it has the *lowest* survival and the highest damage taken. It arrives at center ~turn 12, gets swarmed, and wins the matches where it survives the pile-on. Gate for evolution passed: the ruleset doesn't collapse to "sit on the center."
- Camper as bait: draws doubled (4.7 → 9.6%). Center is a fixed fight location from early on, more simultaneous deaths. chaserV1's damage dealt went up and wins went down — it hits the camper at center, then V2s (arriving via the storm rule) finish it.
- Camper takes ×2 from behind because `STAY` never rotates. → v2 with bounce-turn.
- **Camper v2** (bounce-turn when the adjacent target is at rear). 1:1 swap for v1, same seed: 15.7% vs 14.8% (+0.9pp), damage taken −2%, draws 9.6 → 8.5. Both in one 9-seat lineup: v2 10.9 / v1 10.4, both below baseline — two campers fight for one tile and the loser parks adjacent as a stationary target. Swap is the measurement.
- Facing has a low ceiling: rear is 1 of 8 approach arcs and the first rear hit is unavoidable, so bounce-turn can only touch ~1/8 of incoming damage. The ×2 rear bonus is too narrow to shape play. Revisit if facing should matter more: wider rear arc, or side ×1.5.
- v1 retired; "camper" = v2 from here.
- **Net v0, random weights** (9-seat lineup: 3×chaserV2 / 3×chaserV1 / camperV2 / coward / net, 10k, seed 1790266907455, bigmap): 3.2% per seat, 0.29× baseline. Lowest damage taken in the lineup — it wanders away from fights and dies to the storm. This is generation 0; evolution has to beat it.
- **Evolution v0** (linear, pop 50, keep 10, step 0.1, 100 eval matches, pool chaserV2×2 / camperV2 / coward, score = wins×100 + survival + dealt). Three runs, each 10k-checked in the 9-seat lineup, baseline 11.1%:

  | run | training score | 10k win % | ×baseline | survival | dealt | taken |
  |---|---|---|---|---|---|---|
  | random (gen 0) | — | 3.2 | 0.29 | 28 | 58k | 77k |
  | gen 3, fixed eval seed | 7682 | 7.5 | 0.67 | 36 | 66k | 72k |
  | gen 100, fixed eval seed | 8162 | 8.0 | 0.72 | 36.5 | 66.6k | 73k |
  | gen 100, rotating eval seed | ~7000 (noisy) | 7.8 | 0.70 | 36.5 | 65.2k | 73k |

- Converges in ~3 generations, then plateaus. Not memorization: rotating the eval seed per generation (`deriveSeed(seed, 'gen', gen)`) gives the same 10k profile. Same brain shape every run — highest survival in the lineup, lowest damage taken, moderate damage dealt. That's the optimum of the score as written: ~3,000 points of survival per 100 matches vs 100 per win, so it learns "don't die" and stops. chaserV2 wins 14% by dealing 92k and dying sooner — a trade the fitness function penalizes.
- Training score stopped being a progress bar once the seed rotates (per-gen match sets differ in difficulty). The 10k check is the measurement.
- Past coward (5.7) and chaserV1 (6.4). Below camper and chaserV2.
- Eval noise: one saved brain, five seeds. 100 matches: 6664 / 7325 / 7762 / 7052 / 6872 (±8%). 500 matches: 33575 / 33824 / 35620 / 33824 / 33637 (±3%). Per-generation gains were +20–50 at the 100-match scale, so the top 10 were partly luck. → 500 matches per evaluation.
- Next, one at a time: ~~(1) eval match count~~ → 500; (2) fitness reweight — wins ×1000 or dealt ×5; (3) hidden layer only if 2 doesn't move it.

## Evolution (v1 design)

### Input encoding(18)
| field | count | divisor |
|---|---|---|
| slot × 3: present | 1 | — (0/1) |
| slot × 3: dx, dy | 2 | visionRange (→ −1…1) |
| slot × 3: hp | 1 | maxHp (→ 0…1) |
| self hp | 1 | maxHp |
| self facing | 2 | sin/cos from DELTAS, diagonals ÷ √2 |
| storm center dx, dy | 2 | max(width, height) |
| storm radius | 1 | max(width, height) |

Slots ordered nearest first; empty slot = present 0, rest 0. Dropped: map w/h (constant), turn and phase (same info as radius), enemy facing (rear is 1/8 of arcs, not worth 6 inputs).

### Output
- 9 move logits → argmax → Direction
- attack: hardcoded nearest-alive-in-range (not learned)
- Output index → `DIRECTIONS[i]` (order from `types.ts`: N, NE, E, SE, S, SW, W, NW, STAY). Weights layout: 9 rows × 19, row `j` = 18 input weights then bias.

### Network
v0 no hidden layer, 18·9 + 9 = 171 weights. 
v1 h = 8, tanh, 18·8 + 8 + 8·9 + 9 = 233.

### Loop
- Population 50, elitism 10 (survivors carry over unchanged and are re-scored every generation), 40 children by mutating survivors round-robin (`i % 10`).
- `mutate` = every weight + `(rng·2−1)·step`, new copy. step 0.1 default, CLI arg.
- One eval seed per generation, `deriveSeed(seed, 'gen', gen)`: all 50 brains face the same 500 matches, next generation faces different ones. One master seed reproduces the whole run.
- Best of the final generation → `best.json` (gitignored). Seat it via the `evolved` entrant for the 10k check.
- Printed per gen: best score and its `born` generation. A gen-0 brain still on top late is a "nothing's improving" alarm, not a good brain.

### Fitness
- pool: chaserV2 ×2, camperV2, coward, plus the network = 5 seats.
- fitness = score = wins × 100 + survivalTurns + damageDealt (non-zero for a random brain, so gen 1 has something to rank)
- matches per evaluation: 500 (100 gave ±8% noise on one brain across five seeds, 500 gives ±3%; see findings)

### Open
- if the evolved bot camps, fitness is rewarding survival over engagement; consider weighting damage higher or capping survival.
- score plateaus at "survive first" — reweight pending