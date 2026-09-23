# bot arena

A project where you can pit bots against each other in a last-man-standing match on a fog-of-war grid. The rules evolve over versions (storm, resources), and so do the bots — hand-written FSMs now, evolved and ML brains later.

## Run it

```bash
npm install
```

```bash
npm run dev
```



Open http://localhost:5173/ (the default) to see a match played on the grid. Open the console to see the tournament tally.

## How it works

- **Pure sim** (`step`, `observe`) — the renderer is a separate consumer. The `sim/` folder contains all the engine-like features the game needs; for example `chebyshev()` gives each player its square-shaped range.
- **Brain interface** — the one slot everything plugs into. `observe()` produces all the information a player gets each turn (own HP, visible ships, etc.), and the brain returns an `Action`: a move, plus an optional attack.
- **Seeded RNG** — every match is reproducible. `random.ts` builds a seeded generator so any result can be replayed.

## Rules (v1)

- **Chebyshev distance** — square-shaped range, matching 8-direction movement.
- **Attacks before moves** — attacks resolve on positions at the start of the turn, so a player can't attack and run in the same tick.
- **Simultaneous damage** — all damage is tallied and applied at once, so no one gets a turn-order advantage and can eliminate an opponent before they retaliate.
- **Dead ships stay** —  ships don't share tiles and wrecks act as obstacles.
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

**Storm (center-fixed).** Timeouts 35% → 0 in 100 matches, ~9% draws. Tally by name was chaser 48 / coward 43, but the lineup had 3 chasers and 4 cowards, so per seat the chaser still wins (~16 vs ~11). What changed is that the coward's hoarded HP now converts into wins instead of timeouts: the chaser wins the fights, the coward wins the wait. Combat still clears most of the field before the storm does. → Next: per-seat stats before any more balance changes.

## Roadmap

- **Storm** — a closing zone to encourage fighting.
- **Resources** — map pickups like heal, shield, etc.
- **Evolution** — tiny neural-net brains, tournament wins as fitness, winners kept and mutated.
- **RL** — brains trained on the game (in Python), plugged back in.
- **Rust/WASM** — I want to learn Rust. The game stays in TS for now; once more features land or `step()` (the function that runs each turn) gets slow, I'll port it.