# Training a bot with gradients instead of evolution

The arena is a deterministic 20×20 last-one-standing sim with a shrinking storm. Bots
implement one interface — `decide(observation) → action` — and every experiment below is
scored the same way: 10,000 matches against a fixed held-out lineup of hand-written bots
and earlier learned brains, 9 seats, so a random seat wins 11.1%.

## Starting point: evolution

A linear policy (18 inputs → 9 move logits, 171 weights) trained by mutation and
selection: 50 candidates, 500 matches each per generation, keep the top 10. It beat the
hand-written bots on its training pool after ~100 generations (2.5M matches), then fell
apart when the opponents changed — 8.2% on the held-out. Its shape was "survive first":
highest survival in the lineup, low damage. I read that as the fitness formula rewarding
passivity, since survival contributed ~30× the points a win did.

## Same objective, different optimizer

REINFORCE on the same linear policy, same fitness, same opponents. Softmax over the logits,
sample a move, credit every decision in a match with the match's score, one gradient step
per 500 matches — closed-form gradient, no autograd.

| training matches | evolution | REINFORCE (2 seeds) |
|---|---|---|
| 500k | — | 21.0 / 16.9 |
| 2.5M | 8.2 | 25.3 / 25.9 |

Same shape — still survival-first — but a good version of it instead of a bad one. The
formula wasn't the bug; the optimizer was. Evolution spends 25,000 matches per step to
rank 50 candidates and keeps a few bits; policy gradient gets a direction out of every
match it plays.

## Paying for damage instead

Replacing the score with a per-turn reward (damage dealt − taken, +100 for winning, no
survival term) produced a fighter: 30.1% on one seed, 70k damage dealt, the most of any
brain. The other seed got 20.6%. Same mean as before, ten times the spread.

## One input

A linear net can't compute "am I inside the storm" from center offset and radius — that
needs a square root. Adding it as a 19th input did nothing for the survival objective
(the net just survived more and wins didn't move) and everything for the damage objective:

| objective | encoding | 2.5M matches, 2 seeds |
|---|---|---|
| fitness | v1 | 25.3 / 25.9 |
| dense | v1 | 30.1 / 20.6 |
| dense | v2 | **28.3 / 28.8** |

The spread collapsed from 9.5 points to 0.5. The weak seed had never learned to dodge the
storm from the raw inputs; handing it the edge distance fixed that, and both seeds
converged to the same brain: most damage, most kills, still the longest-lived.

## What I'd take from it

- Measure on a held-out lineup, not the training score. Training fitness went *down*
  under the objective that won more.
- Two seeds minimum. A 4-point gap at 1,000 updates vanished at 5,000; a 10-point gap at
  5,000 turned out to be a missing input.
- Engineered inputs are cheaper than capacity. One feature the net provably couldn't
  compute did more than any amount of training.
- The brain's job now is playtesting: every rules change gets checked against a brain
  retrained on it, so the design isn't guessing about what a good player would do.

Still open: advantage normalization, a nearest-enemy distance input, a hidden layer,
memory across turns. Numbers to beat are in DECISIONS.md.