# bot arena

A project where you can pit bots against each other in a last-man-standing match on a fog-of-war grid. The rules evolve over versions (storm, resources), and so do the bots — hand-written FSMs now, evolved and ML brains later.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173/ (the default) to watch a single match replayed on the grid.

```bash
npm run tournament -- <matches> <seed>
```

Runs a headless tournament in Node and prints the win tally and per-seat stats. 10,000 matches take about 4 seconds.

## How it works

- **Pure sim** (`step`, `observe`) — the renderer is a separate consumer. The `sim/` folder contains all the engine-like features the game needs; for example `chebyshev()` gives each player its square-shaped range. Because nothing in the sim knows about the browser, the same code runs the canvas replay and the headless tournament.
- **Brain interface** — the one slot everything plugs into. `observe()` produces all the information a player gets each turn (own HP, visible ships, storm state), and the brain returns an `Action`: a move, plus an optional attack.
- **Seeded RNG** — every match is reproducible. `random.ts` builds a seeded generator, with a separate stream for the world, the seating, and each bot, so any result can be replayed.
- **Per-seat stats** — every match logs wins, survival turns, damage dealt/taken and kills per entrant, with random seating so no bot is stuck with a lucky or unlucky slot.

## Rules (v1)

- **Chebyshev distance** — square-shaped range, matching 8-direction movement.
- **Attacks before moves** — attacks resolve on positions at the start of the turn, so a player can't attack and run in the same tick.
- **Simultaneous damage** — all damage is tallied and applied at once, so no one gets a turn-order advantage and can eliminate an opponent before they retaliate.
- **Facing** — a ship faces the way it last moved. Hits from behind do double damage.
- **Solid ships** — one ship per tile, no passing through each other; a blocked move turns the ship but doesn't move it.
- **Dead ships stay** — wrecks act as obstacles.
- **Storm** — a circle around the map center shrinks every few turns; ships outside it take growing damage until the whole map is storm. Bots see where the circle is, not how much it hurts.
- **Last one standing** wins.

## Bots

- **Random** — wanders the map; if an enemy is in range, it shoots it.
- **Chaser** — wanders until it sees an enemy, locks on, and pursues until the target is eliminated, out of sight, or the chaser itself dies.
- **Coward** — wanders and fights like the chaser, but once its HP drops below 45% it runs from the nearest visible enemy.

## What the tournament taught me

Each entry is one change to the rules or bots, what the tally said, and what I concluded from it.

**No facing, no storm.** Chaser vs random ends in a tie every time. Both have the same stats, both shoot whenever anyone's in range, and damage is simultaneous — so they eliminate each other on the same turn. There's no way to win a "fair fight"; one side has to start the fight at a disadvantage, which means it fought someone else first. → Added facing with a rear ×2 multiplier.

**Collision, 8-player free-for-all.** Random beats chaser 68 to 21. With no storm and nothing to encourage fighting, seeking out combat is the least optimal way to win — the bot that avoids everyone outlives the bots that trade damage.

**Coward bot.** The coward can't win most matches unless it gets lucky spawns: once a chaser locks on, the coward stops shooting but the chaser keeps closing the gap and shooting. As written, it's in an unwinnable spot. And two cowards fleeing each other never resolve — 35% of matches timed out. → Justified the storm.

**Storm (center-fixed).** Timeouts 35% → 0 in 100 matches, ~9% draws. Tally by name was chaser 48 / coward 43, but the lineup had 3 chasers and 4 cowards, so per seat the chaser still wins (~16 vs ~11). What changed is that the coward's hoarded HP now converts into wins instead of timeouts: the chaser wins the fights, the coward wins the wait. Combat still clears most of the field before the storm does. → Next: per-seat stats before any more balance changes. (Wrong, as it turned out — see the next entry.)

**Per-seat stats, 1000 matches.** Chaser ~15.7% wins per seat, coward ~10.9%. The "coward wins the wait" story doesn't hold: both bots survive the same ~19 turns on average, but the coward deals half the damage and gets a third of the kills. Fleeing at 45% HP with range-1 attacks just turns its rear to an adjacent enemy. Its wins are the matches where spawn and wander luck leave it standing last, not a strategy paying off. → Coward v2 isn't "add storm awareness"; the flee trigger itself is the problem.

**Collision bug.** Two ships could end up on the same tile when one bounced back into a tile another had just moved into. Fixed with cascading bounces and solid ships. Same seed, 1000 matches: chaser survival +20%, draws −21%, win rates barely moved. The earlier numbers were mildly wrong; the conclusion wasn't.

**Seating/spawn correlation, 10k matches.** One of four identical cowards won 11.25% while the others sat at ~10.0% — far outside noise. The seat shuffle and the spawn positions were being drawn from the same random sequence, so *which* entrant sat where was correlated with *where* it spawned. Giving the shuffle its own stream put all four at 10.3–10.6%. Lesson: "one RNG stream per purpose" isn't just for reproducibility, it's for keeping independent things independent. Current baseline: chaser 17.1% per seat, coward 10.4%, draws 6.8%.

## Roadmap

- ~~**Storm**~~ — a closing zone to encourage fighting.
- ~~**Tournament stats**~~ — per-seat wins, survival, damage, kills; headless runner.
- **Opponent pool** — storm-aware Chaser, a Camper that holds the center, a Kiter that keeps enemies at range. Three different answers to "when do you fight", so a learned brain can't beat everything with one trick.
- **Resources** — map pickups like heal, shield, etc.
- **Evolution** — tiny neural-net brains, tournament wins as fitness, winners kept and mutated.
- **RL** — brains trained on the game (in Python), plugged back in.
- **Rust/WASM** — I want to learn Rust. The sim does 10k matches in ~4 s already, so this is for learning, not speed; once evolution runs millions of matches it might become both.