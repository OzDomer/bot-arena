# Decisions

Each entry: what we decided, why, and what it would take to revisit.

## Architecture
- **Pure sim, separate renderer.** `step(world, actions) → world`, no DOM, no mutation. Enables replay, headless tournaments, tests, and any future renderer (3D, Node, another language). Revisit: never.
- **Brain interface.** `decide(Readonly<Observation>) → Action`. The one slot every bot type plugs into. Bots get copies, never world references.
- **Worlds are immutable after creation.** Unmoved ships share position objects across frames; that's fine only because nothing writes into them. Never mutate a world.
- **Rules object.** All tunables in `Rules`; `World.rules` points at it. Per-match randomized setup (storm center) lives on `World`; anything derivable from turn + rules is a function, not state.
- **Seeded RNG, one stream per bot + one for the world**, derived from the match seed. Changing one bot's randomness can't perturb another's.

## Rules (v1)
- **Chebyshev distance** for vision and attack — matches 8-direction movement. (Manhattan caused diagonal chasers to swap tiles forever.)
- **Attacks resolve before moves**, on start-of-tick positions and facing. Turning happens during the move phase, after combat.
- **Simultaneous damage** via a tally, so array order never gives initiative.
- **Dead ships stay** as wrecks and block tiles.
- **One ship per tile.** Wrecks and stayers claim first; movers resolve in id order (lower id wins — known bias, fix by rotating slots in tournaments).
- **Facing = last move direction.** No rotate action. A bounced move still turns the ship. Rear hits ×2, side/front ×1.
- **Storm:** circle from a center chosen per match, radius shrinks one tile per phase after `startTurn`, damage `baseDamage × phase`, applied after moves, once radius goes negative (floors at −1). Bots see the full storm.
- **Last one standing wins.** 0 alive = draw, >1 at turn cap = timeout.

## Rejected
- Damage RNG (luck, not skill). Move-XOR-attack (kills the RTS feel). Bracing (rewards camping). Bot "retry" on blocked move (breaks the GM model; bots can see the tile is taken).

## Roadmap
1. Storm (in progress)
2. Heal resource + CowardFSMv2 (old bots frozen as baselines)
3. Tournament stats — per-bot survival, damage, kills; rotate slots; the fitness signal
4. Evolution (tiny NN brains, small visible runs), then RL
5. Port `step()` to Rust — to learn Rust, not for speed
6. RTS: momentum physics, continuous positions, islands, disembarking; re-evolve

## Tournament findings
- Identical-stat shooters always draw 1v1 → needed asymmetry → facing.
- Free-for-all: random beat chaser ~3:1 before facing; aggression is punished when there's no reason to fight.
- Chaser vs coward: 35% timeouts (two cowards fleeing each other forever) → justifies the storm.