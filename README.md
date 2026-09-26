# bot arena

A project where you can pit bots against each other in a last-man-standing match on a fog-of-war grid. The rules evolve over versions (storm, resources), and so do the bots — hand-written FSMs first, then evolved neural-net brains, ML later.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173/ (the default) to watch a single match replayed on the grid.

```bash
npm run tournament -- <matches> <seed> <preset>
```

Runs a headless tournament in Node and prints the win tally and per-seat stats. Presets are `default` (10×10), `bigmap` (20×20, faster storm — the current ruleset), plus the experiment presets that produced it. 10,000 matches take a few seconds.

```bash
npm run evolve -- <generations> <step> <seed>
```

Evolves a linear-net brain against a fixed pool of hand-written bots and writes the best weights to `best.json`. Seat it in the tournament lineup as `evolved` to measure it against everything else.

## How it works

- **Pure sim** (`step`, `observe`) — the renderer is a separate consumer. The `sim/` folder contains all the engine-like features the game needs; for example `chebyshev()` gives each player its square-shaped range. Because nothing in the sim knows about the browser, the same code runs the canvas replay, the headless tournament, and evolution.
- **Brain interface** — the one slot everything plugs into. `observe()` produces all the information a player gets each turn (own HP, visible ships, storm state), and the brain returns an `Action`: a move, plus an optional attack. Hand-written bots and the neural net implement the same interface; the sim can't tell them apart.
- **Seeded RNG** — every match is reproducible. `random.ts` builds a seeded generator, with a separate stream for the world, the seating, and each bot, so any result can be replayed.
- **Per-seat stats** — every match logs wins, survival turns, damage dealt/taken and kills per entrant, with random seating so no bot is stuck with a lucky or unlucky slot.
- **Rules presets** — every tunable lives in one `Rules` object. Presets are named `Rules` values; the CLI picks one. Experiments are run by swapping presets, never by editing constants, so the preset file is the record of what was tested.
- **Evolution pipeline** — `encode()` turns an observation into 18 numbers (nearest three ships, own HP and facing, storm offset and radius). `NetBrain` is a linear net: 18 inputs → 9 move logits → argmax → direction; attack is hardcoded to nearest-in-range. `fitness()` scores a brain from its per-seat stats. `evolve()` runs a population of 50, keeps the top 10, refills by mutation. Plain arrays, no libraries.

## Rules (v1 → v2)

- **Chebyshev distance** — square-shaped range, matching 8-direction movement.
- **Attacks before moves** — attacks resolve on positions at the start of the turn, so a player can't attack and run in the same tick.
- **Attacks ignore the attacker's facing** — you can shoot in any direction. Facing is defense only.
- **Simultaneous damage** — all damage is tallied and applied at once, so no one gets a turn-order advantage and can eliminate an opponent before they retaliate.
- **Facing** — a ship faces the way it last moved. Hits from behind do double damage.
- **Solid ships** — one ship per tile, no passing through each other. A blocked move turns the ship but doesn't move it — which means moving *into* an adjacent enemy is a free rotate to face it.
- **Dead ships stay** — wrecks act as obstacles.
- **Storm** — a circle around the map center shrinks every few turns; ships outside it take growing damage until the whole map is storm. Bots see where the circle is, not how much it hurts.
- **Last one standing** wins.

v1 was a 10×10 map with the storm shrinking every 10 turns. **v2** is 20×20 with the storm shrinking every 5 — chosen from the rules experiments below, for lower draw rates and strategies that actually differentiate.

## Bots

- **Random** — wanders the map; if an enemy is in range, it shoots it.
- **Chaser** — wanders until it sees an enemy, locks on, and pursues until the target is eliminated, out of sight, or the chaser itself dies.
- **Chaser v2** — same, but heads for the storm center whenever it's outside the safe circle. On a big map with short vision, this doubles as a way to *find* enemies.
- **Coward** — wanders and fights like the chaser, but once its HP drops below 45% it runs from the nearest visible enemy.
- **Camper** — walks to the storm center and stays, shooting anything in range. v2 turns to face an attacker at its rear (the free-rotate rule above).
- **Evolved** — the saved neural-net brain from `npm run evolve`.

## What the tournament taught me

Each entry is one change to the rules or bots, what the tally said, and what I concluded from it.

**No facing, no storm.** Chaser vs random ends in a tie every time. Both have the same stats, both shoot whenever anyone's in range, and damage is simultaneous — so they eliminate each other on the same turn. There's no way to win a "fair fight"; one side has to start the fight at a disadvantage, which means it fought someone else first. → Added facing with a rear ×2 multiplier.

**8-player free-for-all.** Random beats chaser 68 to 21. With no storm and nothing to encourage fighting, seeking out combat is the least optimal way to win — the bot that avoids everyone outlives the bots that trade damage.

**Coward bot.** The coward can't win most matches unless it gets lucky spawns: once a chaser locks on, the coward stops shooting but the chaser keeps closing the gap and shooting. As written, it's in an unwinnable spot. And two cowards fleeing each other never resolve — 35% of matches timed out. → Justified the storm.

**Storm (center-fixed).** Timeouts 35% → 0 in 100 matches, ~9% draws. Tally by name was chaser 48 / coward 43, but the lineup had 3 chasers and 4 cowards, so per seat the chaser still wins (~16 vs ~11). What changed is that the coward's hoarded HP now converts into wins instead of timeouts: the chaser wins the fights, the coward wins the wait. Combat still clears most of the field before the storm does. → Next: per-seat stats before any more balance changes. (Wrong, as it turned out — see the next entry.)

**Per-seat stats, 1000 matches.** Chaser ~15.7% wins per seat, coward ~10.9%. The "coward wins the wait" story doesn't hold: both bots survive the same ~19 turns on average, but the coward deals half the damage and gets a third of the kills. Fleeing at 45% HP with range-1 attacks just turns its rear to an adjacent enemy. Its wins are the matches where spawn and wander luck leave it standing last, not a strategy paying off. → Coward v2 isn't "add storm awareness"; the flee trigger itself is the problem.

**Collision bug.** Two ships could end up on the same tile when one bounced back into a tile another had just moved into. Fixed with cascading bounces and solid ships. Same seed, 1000 matches: chaser survival +20%, draws −21%, win rates barely moved. The earlier numbers were mildly wrong; the conclusion wasn't.

**Seating/spawn correlation, 10k matches.** One of four identical cowards won 11.25% while the others sat at ~10.0% — far outside noise. The seat shuffle and the spawn positions were being drawn from the same random sequence, so *which* entrant sat where was correlated with *where* it spawned. Giving the shuffle its own stream put all four at 10.3–10.6%. Lesson: "one RNG stream per purpose" isn't just for reproducibility, it's for keeping independent things independent. (Under v1 rules: chaser 17.1% per seat, coward 10.4%, draws 6.8%.)

**Rules experiments, 10k matches each.** Six presets: 10×10 and 20×20, each with the default storm, an earlier-starting one, and a faster-shrinking one. Map size is the lever — doubling it halves draws and cuts kills per match, because spawns stop landing on top of each other. Storm timing is a dial on top: the gap between the storm-aware chaser and the plain one tracks storm pressure monotonically, 1.1pp → 10.4pp, and on the big map `shrinkEvery` is the knob that moves it while `startTurn` is noise. The coward barely moves under any ruleset; it "beat" the plain chaser on the big map only because the chaser fell past it. → v2 = 20×20, shrink every 5.

**Camper.** The pre-declared worry was that a bot sitting on the last safe tile would win by outlasting everyone. It doesn't: the camper has the *lowest* survival in the lineup and takes the most damage. It arrives at the center early, gets swarmed by everything the storm pushes inward, and wins the matches where it survives the pile-on. Draws doubled — the center became a fixed fight location. Strong, not degenerate; the ruleset holds.

**Facing has a low ceiling.** Camper v2 turns to face an attacker at its rear, using the blocked-move rotate. Worth +0.9pp and −2% damage taken — real, but small. Rear is one of eight approach directions, and the first rear hit is unavoidable, so no amount of facing management can touch more than a sliver of incoming damage. The ×2 multiplier is too narrow to shape play.

**Evolution v0.** A random linear net wins 3.2% per seat. After three generations: 7.5%, past the coward and the plain chaser. After a hundred: 8%. Rotating the evaluation matches each generation to rule out memorization: still 8%. Three runs, same brain shape every time — highest survival in the lineup, lowest damage taken, moderate damage dealt. It found the optimum of the fitness function as written, where survival turns outweigh wins thirty to one, and stopped. The storm-aware chaser wins 14% by dealing more and dying sooner — a trade the score penalizes. Also measured: 100 evaluation matches gives ±8% noise on a single brain's score across seeds, so early generations were ranking luck; 500 gives ±3%. → Fitness reweight next.

## Roadmap

- ~~**Storm**~~ — a closing zone to encourage fighting.
- ~~**Tournament stats**~~ — per-seat wins, survival, damage, kills; headless runner.
- ~~**Rules presets**~~ — and the experiments that picked v2.
- ~~**Opponent pool**~~ — storm-aware Chaser, Camper. The Kiter is deferred: it keeps enemies at range to buy time, and time is worthless until there's a resource to spend it on.
- **Evolution** — in progress. Linear net evolves and plateaus at "survive first." Next: reweight fitness toward wins and damage; then a hidden layer if the score isn't the ceiling.
- **Parallel evaluation** — one worker per core. At 500 matches per brain, a generation is ~10 s and this is the bottleneck.
- **Resources** — map pickups like heal, shield, etc. Then the Kiter.
- **RL** — brains trained on the game (in Python), plugged back in.
- **Rust/WASM** — I want to learn Rust. This was "for learning, not speed" when 10k matches took 4 s; now that evolution runs 25k matches a generation, it's both.