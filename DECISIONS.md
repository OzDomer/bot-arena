# Decisions

Each entry: what we decided, why, and what it would take to revisit.

## Architecture
- **Pure sim, separate renderer.** `step(world, actions) → world`, no DOM, no mutation. Enables replay, headless tournaments, tests, and any future renderer (3D, Node, another language). Revisit: never.
- **Brain interface.** `decide(Readonly<Observation>) → Action`. The one slot every bot type plugs into. Bots get copies, never world references.
- **Worlds are immutable after creation.** Unmoved ships share position objects across frames; that's fine only because nothing writes into them. Never mutate a world.
- **Rules object.** All tunables in `Rules`; `World.rules` points at it. Per-match randomized setup (storm center) lives on `World`; anything derivable from turn + rules is a function, not state.
- **Seeded RNG, one stream per bot + one for the world**, derived from the match seed. Changing one bot's randomness can't perturb another's.
- **Observation is what a player sees, not the world. map exposes only width, height and turn — not Rules. Storm damage is deliberately hidden; a bot (hand-written or learned) has to infer that the storm hurts and how badly. Revisit: if evolved brains can't learn it, expose damage and note why.

## Rules (v1)
- **Chebyshev distance** for vision and attack — matches 8-direction movement. (Manhattan caused diagonal chasers to swap tiles forever.)
- **Attacks resolve before moves**, on start-of-tick positions and facing. Turning happens during the move phase, after combat.
- **Simultaneous damage** via a tally, so array order never gives initiative.
- **Dead ships stay** as wrecks and block tiles.
- **One ship per tile.** Wrecks and stayers claim first; movers resolve in id order (lower id wins — known bias, fix by rotating slots in tournaments).
- **Facing = last move direction.** No rotate action. A bounced move still turns the ship. Rear hits ×2, side/front ×1.
- **Storm:** circle from a center chosen per match, radius shrinks one tile per phase after `startTurn`, damage `baseDamage × phase`, applied after moves, whole map is storm once radius goes negative (floors at −1). Bots see the storm as a player would: center, radius and phase, never the damage number.
- **Last one standing wins.** 0 alive = draw, >1 at turn cap = timeout.

## Rejected
- Damage RNG (luck, not skill). Move-XOR-attack (kills the RTS feel). Bracing (rewards camping). Bot "retry" on blocked move (breaks the GM model; bots can see the tile is taken).

## Roadmap
1. ~~Storm~~ (done — center-fixed; randomize center later)
2. Tournament stats — per-seat wins, survival turns, damage dealt/taken, kills; rotate slots; headless Node entry. The fitness signal.
3. Storm-aware ChaserFSM/CowardFSM v2 (v1 frozen as baselines)
4. ~~ Observation~~ (map = width/height/turn; storm = center/radius/phase, no damage)
5. Heal resource
6. Evolution (tiny NN brains), then RL
6. Port `step()` to Rust — to learn Rust, not for speed
7. RTS: momentum physics, continuous positions, islands, disembarking; re-evolve

## Tournament findings
- Identical-stat shooters always draw 1v1 → needed asymmetry → facing.
- Free-for-all: random beat chaser ~3:1 before facing; aggression is punished when there's no reason to fight.
- Chaser vs coward: 35% timeouts (two cowards fleeing each other forever) → justifies the storm.
- Storm (v1, center-fixed): timeouts 35% → 0 in 100 matches, draws ~9%. Tally by name was chaser 48 / coward 43, but the lineup was 3 chasers vs 4 cowards — per seat chaser still wins ~16 vs ~11. The storm converts the coward's hoarded HP into wins instead of timeouts. combat still clears most of the field before the storm does.
- Per-seat stats, 1000 matches, random seating: chaser ~15.7% wins per seat, coward ~10.9%. Identical bots land within ±1pp of each other, so 1000 is the minimum sample for a balance read. The "coward wins the wait" story was wrong: average survival is the same for both (~19 turns), but the coward deals half the damage and gets a third of the kills. Fleeing at 45% HP with range-1 attacks just turns its rear to an adjacent enemy. Its ~11% wins are the matches where spawn and wander randomness leave it standing last, not a strategy paying off.