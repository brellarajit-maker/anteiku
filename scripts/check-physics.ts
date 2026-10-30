/**
 * Headless sanity checks for the billiards solver.
 *
 * Run with:  node --experimental-strip-types scripts/check-physics.ts
 *
 * These are the properties that, when they break, make a table feel wrong:
 * balls escaping the slate, a rack that never settles, energy appearing from
 * nowhere, and pockets that refuse to take a ball.
 */

import {
  POOL_TABLE,
  PoolSim,
  TUNING,
  rackEightBall,
  type Ball,
} from '../src/lib/pool/physics.ts';

let failures = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function kinetic(balls: Ball[]): number {
  return balls.reduce((sum, b) => (b.potted ? sum : sum + (b.vel.x ** 2 + b.vel.z ** 2)), 0);
}

/** Step until everything parks, or give up after `limit` simulated seconds. */
function runToRest(sim: PoolSim, limit = 60): number {
  let t = 0;
  while (!sim.settled && t < limit) {
    sim.step(1 / 120);
    t += 1 / 120;
  }
  return t;
}

console.log('\nbreak from the head spot');
{
  const sim = new PoolSim(POOL_TABLE, rackEightBall(POOL_TABLE));
  const before = kinetic(sim.balls);
  check('rack starts at rest', before === 0);
  check('16 balls on the table', sim.balls.length === 16);

  // A firm break, aimed a touch off centre so the spread is not symmetrical.
  sim.strike({ x: 1, z: 0.035 }, 7.6);
  const launched = kinetic(sim.balls);

  const settleTime = runToRest(sim);
  check('table settles', sim.settled, `still moving after ${settleTime.toFixed(1)}s`);
  check(
    'settles in a plausible time',
    settleTime > 1.5 && settleTime < 25,
    `${settleTime.toFixed(2)}s`,
  );

  const spread = sim.balls.filter((b) => !b.potted);
  check('energy is gone at rest', kinetic(spread) === 0);
  check('no energy was created', kinetic(sim.balls) <= launched);

  const r = POOL_TABLE.ballRadius;
  const hx = POOL_TABLE.length / 2;
  const hz = POOL_TABLE.width / 2;
  const escaped = spread.filter(
    (b) => Math.abs(b.pos.x) > hx - r + 1e-6 || Math.abs(b.pos.z) > hz - r + 1e-6,
  );
  check('every ball is on the slate', escaped.length === 0, `${escaped.length} escaped`);

  const overlapping: string[] = [];
  for (let i = 0; i < spread.length; i += 1) {
    for (let j = i + 1; j < spread.length; j += 1) {
      const d = Math.hypot(spread[i].pos.x - spread[j].pos.x, spread[i].pos.z - spread[j].pos.z);
      if (d < r * 2 - 1e-4) overlapping.push(`${spread[i].id}/${spread[j].id}`);
    }
  }
  check('no two balls overlap', overlapping.length === 0, overlapping.join(', '));

  const moved = sim.balls.filter((b) => b.id !== 'cue' && (b.potted || b.pos.x !== 0));
  check('the rack actually broke', moved.length >= 14);

  console.log(`       → ${settleTime.toFixed(2)}s to rest, ${16 - spread.length} potted`);
}

console.log('\npockets take a ball');
{
  const corner = POOL_TABLE.pockets[1]; // +x, -z
  const sim = new PoolSim(POOL_TABLE, [
    {
      id: 'cue',
      kind: 'cue',
      number: 0,
      pos: { x: corner.pos.x - 0.5, z: corner.pos.z + 0.5 },
      vel: { x: 0, z: 0 },
      quat: [0, 0, 0, 1],
      potted: false,
    },
  ]);
  sim.strike({ x: 1, z: -1 }, 2.4);
  runToRest(sim, 20);
  check('a ball rolled at a corner drops', sim.balls[0].potted === true);
  check('the pot was reported', sim.events.some((e) => e.type === 'pot'));
}

console.log('\ncushions rebound rather than absorb');
{
  const sim = new PoolSim(POOL_TABLE, [
    {
      id: 'cue',
      kind: 'cue',
      number: 0,
      // Mid-table on the long axis, so it hits a short rail clear of any jaw.
      pos: { x: 0.2, z: 0 },
      vel: { x: 0, z: 0 },
      quat: [0, 0, 0, 1],
      potted: false,
    },
  ]);
  sim.strike({ x: 1, z: 0 }, 3);
  // Long enough to reach the rail and come back, short of stopping.
  for (let i = 0; i < 90; i += 1) sim.step(1 / 120);
  const b = sim.balls[0];
  check('it turned around', b.vel.x < 0, `vx=${b.vel.x.toFixed(3)}`);
  check('it lost energy to the rubber', Math.abs(b.vel.x) < 3);
  check('it stayed out of the pockets', b.potted === false);
  check('the cushion hit was reported', sim.events.some((e) => e.type === 'cushion'));
}

console.log('\nstepping is frame-rate independent');
{
  const build = () => new PoolSim(POOL_TABLE, rackEightBall(POOL_TABLE));
  const a = build();
  const b = build();
  a.strike({ x: 1, z: 0.035 }, 7.6);
  b.strike({ x: 1, z: 0.035 }, 7.6);

  // Two seconds of simulated time, delivered at 120 Hz and at 30 Hz.
  for (let i = 0; i < 240; i += 1) a.step(1 / 120);
  for (let i = 0; i < 60; i += 1) b.step(1 / 30);

  const drift = a.balls.reduce((max, ball, i) => {
    const other = b.balls[i];
    return Math.max(max, Math.hypot(ball.pos.x - other.pos.x, ball.pos.z - other.pos.z));
  }, 0);
  check('30 Hz and 120 Hz agree', drift < 1e-9, `drift ${drift.toExponential(2)} m`);
}

console.log('\na scratch does not end the game');
{
  const corner = POOL_TABLE.pockets[1];
  const sim = new PoolSim(POOL_TABLE, rackEightBall(POOL_TABLE));
  const cue = sim.cueBall!;
  cue.pos = { x: corner.pos.x - 0.4, z: corner.pos.z + 0.4 };
  sim.strike({ x: 1, z: -1 }, 2.4);
  runToRest(sim, 20);

  check('the cue ball went down', cue.potted === true);
  sim.respotCue();
  check('respotting brings it back', sim.cueBall?.potted === false);
  check('it returns to the head spot', sim.cueBall?.pos.x === -POOL_TABLE.length / 4);
  check('it comes back at rest', sim.cueBall?.vel.x === 0 && sim.cueBall?.vel.z === 0);
  check('respotting a ball still on the table does nothing', (() => {
    const before = { ...sim.cueBall!.pos };
    sim.cueBall!.pos = { x: 0.3, z: 0.1 };
    sim.respotCue();
    const moved = sim.cueBall!.pos.x !== 0.3;
    sim.cueBall!.pos = before;
    return !moved;
  })());
}

console.log('\nsleep threshold parks the table');
{
  const sim = new PoolSim(POOL_TABLE, [
    {
      id: 'cue',
      kind: 'cue',
      number: 0,
      pos: { x: 0.2, z: 0 },
      vel: { x: 0, z: 0 },
      quat: [0, 0, 0, 1],
      potted: false,
    },
  ]);
  sim.strike({ x: 0, z: 1 }, TUNING.sleepSpeed * 0.5);
  sim.step(1 / 120);
  check('a nudge below the threshold does not creep', sim.settled);
}

console.log(failures === 0 ? '\nall checks passed\n' : `\n${failures} check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
