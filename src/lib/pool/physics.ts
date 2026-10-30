/**
 * A top-down billiards solver.
 *
 * Balls are circles on a plane. The renderer lifts them to spheres and spins
 * them from the rotation accumulated here, so nothing in this file knows about
 * Three.js — it can be unit-tested and stepped headlessly.
 *
 * Everything is SI: metres, seconds, metres per second. Real table and ball
 * dimensions are used throughout, which is most of why the result reads as
 * convincing rather than as "balls bouncing in a box".
 */

export type Vec2 = { x: number; z: number };
/** [x, y, z, w]. Hand-rolled to keep this module free of Three.js. */
export type Quat = [number, number, number, number];

export type BallKind = 'cue' | 'solid' | 'stripe' | 'eight';

export interface Ball {
  id: string;
  kind: BallKind;
  /** 0 for the cue ball, 1–15 otherwise. Drives the rendered colour. */
  number: number;
  pos: Vec2;
  vel: Vec2;
  /** Accumulated orientation, so the printed number rolls with the ball. */
  quat: Quat;
  potted: boolean;
  /** Where it dropped, so the renderer can animate it into the pocket. */
  pottedInto?: Vec2;
}

export interface Pocket {
  pos: Vec2;
  /** A ball drops when its centre comes within this of the pocket centre. */
  capture: number;
}

export interface TableSpec {
  /** Playfield between the cushion noses, long axis. */
  length: number;
  /** Playfield between the cushion noses, short axis. */
  width: number;
  ballRadius: number;
  pockets: Pocket[];
}

export interface SimEvent {
  type: 'ball-ball' | 'cushion' | 'pot';
  /** Impact speed along the collision normal, m/s. Drives sound and shake. */
  intensity: number;
  at: Vec2;
  ballId?: string;
}

/* -------------------------------------------------------------------------
   Table presets

   8-ball: a 8 ft table has an 88 × 44 in playfield. Snooker is here because
   the availability board names snooker tables and may want a diagram later;
   the hero only ever instantiates the pool table.
------------------------------------------------------------------------- */

const IN = 0.0254;

export const POOL_BALL_RADIUS = (2.25 * IN) / 2; // 28.58 mm
export const SNOOKER_BALL_RADIUS = (2.0625 * IN) / 2;

function pocketsFor(length: number, width: number, corner: number, side: number): Pocket[] {
  const hx = length / 2;
  const hz = width / 2;
  return [
    { pos: { x: -hx, z: -hz }, capture: corner },
    { pos: { x: hx, z: -hz }, capture: corner },
    { pos: { x: -hx, z: hz }, capture: corner },
    { pos: { x: hx, z: hz }, capture: corner },
    { pos: { x: 0, z: -hz }, capture: side },
    { pos: { x: 0, z: hz }, capture: side },
  ];
}

export const POOL_TABLE: TableSpec = {
  length: 88 * IN,
  width: 44 * IN,
  ballRadius: POOL_BALL_RADIUS,
  pockets: pocketsFor(88 * IN, 44 * IN, 0.062, 0.056),
};

/* -------------------------------------------------------------------------
   Tuning

   These are the numbers that decide whether the table feels like slate under
   cloth or like a pinball machine. They are deliberately gathered in one place.
------------------------------------------------------------------------- */

export const TUNING = {
  /** Rolling deceleration on cloth, m/s². A 3 m/s ball coasts about 7 m. */
  friction: 0.62,
  /** Restitution ball-on-ball. Phenolic resin is lively. */
  ballRestitution: 0.95,
  /** Restitution ball-on-cushion. Rubber eats more of it. */
  cushionRestitution: 0.76,
  /** Tangential damping at a cushion, mimicking cloth drag along the rail. */
  cushionTangentialDamping: 0.92,
  /** Below this speed a ball is parked, which is what makes the table settle. */
  sleepSpeed: 0.006,
  /** Fixed integration step. 240 Hz keeps fast break collisions honest. */
  dt: 1 / 240,
  /** Hard cap on substeps per frame so a stalled tab cannot spiral. */
  maxSubsteps: 16,
} as const;

/* -------------------------------------------------------------------------
   Small maths helpers
------------------------------------------------------------------------- */

const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, z: a.z - b.z });
const len = (a: Vec2): number => Math.hypot(a.x, a.z);
const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.z * b.z;

/** q = rotation ⊗ q, with `rotation` built from an axis-angle. */
function spin(q: Quat, axisX: number, axisY: number, axisZ: number, angle: number): Quat {
  const half = angle / 2;
  const s = Math.sin(half);
  const rx = axisX * s;
  const ry = axisY * s;
  const rz = axisZ * s;
  const rw = Math.cos(half);
  const [x, y, z, w] = q;
  return [
    rw * x + rx * w + ry * z - rz * y,
    rw * y - rx * z + ry * w + rz * x,
    rw * z + rx * y - ry * x + rz * w,
    rw * w - rx * x - ry * y - rz * z,
  ];
}

/** Mulberry32 — a seeded PRNG, so a break can be repeatable when it needs to be. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------
   Rack
------------------------------------------------------------------------- */

/**
 * The standard 8-ball rack: apex on the foot spot, the 8 in the middle of the
 * third row, a solid and a stripe in the back corners.
 */
const RACK_ORDER = [1, 11, 2, 8, 10, 9, 3, 14, 4, 5, 13, 15, 6, 12, 7];

export function rackEightBall(table: TableSpec, jitter = 0): Ball[] {
  const r = table.ballRadius;
  // A hair of air between balls so the overlap pass has nothing to resolve
  // on frame one; a tight rack otherwise pops itself apart.
  const gap = r * 2 * 1.002;
  const rowStep = gap * Math.cos(Math.PI / 6);
  const apexX = table.length / 4;

  const balls: Ball[] = [
    {
      id: 'cue',
      kind: 'cue',
      number: 0,
      pos: { x: -table.length / 4, z: 0 },
      vel: { x: 0, z: 0 },
      quat: [0, 0, 0, 1],
      potted: false,
    },
  ];

  const rand = seededRandom(0x8ba11);
  let n = 0;
  for (let row = 0; row < 5; row += 1) {
    for (let j = 0; j <= row; j += 1) {
      const number = RACK_ORDER[n];
      n += 1;
      balls.push({
        id: `b${number}`,
        kind: number === 8 ? 'eight' : number < 8 ? 'solid' : 'stripe',
        number,
        pos: {
          x: apexX + row * rowStep + (rand() - 0.5) * jitter,
          z: (j - row / 2) * gap + (rand() - 0.5) * jitter,
        },
        vel: { x: 0, z: 0 },
        quat: [0, 0, 0, 1],
        potted: false,
      });
    }
  }
  return balls;
}

/* -------------------------------------------------------------------------
   The simulation
------------------------------------------------------------------------- */

export class PoolSim {
  readonly table: TableSpec;
  balls: Ball[];
  /** Drained by the renderer each frame for sound and camera shake. */
  events: SimEvent[] = [];

  private accumulator = 0;

  constructor(table: TableSpec, balls: Ball[]) {
    this.table = table;
    this.balls = balls;
  }

  /** True once every ball has been parked — the cue to reveal the headline. */
  get settled(): boolean {
    return this.balls.every((b) => b.potted || (b.vel.x === 0 && b.vel.z === 0));
  }

  get cueBall(): Ball | undefined {
    return this.balls.find((b) => b.id === 'cue');
  }

  /** Fastest ball on the table, for slow-motion and audio ducking. */
  get peakSpeed(): number {
    let peak = 0;
    for (const b of this.balls) {
      if (b.potted) continue;
      const s = len(b.vel);
      if (s > peak) peak = s;
    }
    return peak;
  }

  /** Send the cue ball off along a unit-ish direction at `speed` m/s. */
  strike(direction: Vec2, speed: number): void {
    const cue = this.cueBall;
    if (!cue || cue.potted) return;
    const l = len(direction) || 1;
    cue.vel = { x: (direction.x / l) * speed, z: (direction.z / l) * speed };
  }

  /**
   * Ball in hand. Puts a potted cue ball back on the head spot, which is what
   * a real game does — without it, one scratch leaves nothing to hit.
   */
  respotCue(): void {
    const cue = this.cueBall;
    if (!cue?.potted) return;
    cue.potted = false;
    cue.pottedInto = undefined;
    cue.pos = { x: -this.table.length / 4, z: 0 };
    cue.vel = { x: 0, z: 0 };
  }

  /** Put every ball back and clear the event queue. */
  reset(balls: Ball[]): void {
    this.balls = balls;
    this.events.length = 0;
    this.accumulator = 0;
  }

  /**
   * Advance by a wall-clock delta. Time is consumed in fixed steps so results
   * do not change with frame rate; `scale` below 1 gives slow motion without
   * altering the physics.
   */
  step(delta: number, scale = 1): void {
    this.accumulator += Math.min(delta, 0.1) * scale;
    let steps = 0;
    while (this.accumulator >= TUNING.dt && steps < TUNING.maxSubsteps) {
      this.substep(TUNING.dt);
      this.accumulator -= TUNING.dt;
      steps += 1;
    }
    if (steps === TUNING.maxSubsteps) this.accumulator = 0;
  }

  private substep(dt: number): void {
    const { balls } = this;
    const r = this.table.ballRadius;

    // 1. Integrate and bleed off speed to cloth friction.
    for (const b of balls) {
      if (b.potted) continue;
      const speed = len(b.vel);
      if (speed === 0) continue;

      if (speed <= TUNING.sleepSpeed) {
        b.vel.x = 0;
        b.vel.z = 0;
        continue;
      }

      const drop = TUNING.friction * dt;
      const next = Math.max(0, speed - drop);
      const k = next / speed;
      b.vel.x *= k;
      b.vel.z *= k;

      b.pos.x += b.vel.x * dt;
      b.pos.z += b.vel.z * dt;

      // Roll: ω = v / r about the axis perpendicular to travel, on the cloth.
      const travelled = next * dt;
      if (travelled > 0) {
        const angle = travelled / r;
        const ax = -b.vel.z / next;
        const az = b.vel.x / next;
        b.quat = spin(b.quat, ax, 0, az, angle);
      }
    }

    // 2. Pockets, before cushions — a ball heading into a jaw must drop rather
    //    than bounce off the rail that runs past it.
    for (const b of balls) {
      if (b.potted) continue;
      for (const p of this.table.pockets) {
        if (len(sub(b.pos, p.pos)) < p.capture) {
          b.potted = true;
          b.pottedInto = { x: p.pos.x, z: p.pos.z };
          b.vel.x = 0;
          b.vel.z = 0;
          this.events.push({ type: 'pot', intensity: 1, at: p.pos, ballId: b.id });
          break;
        }
      }
    }

    // 3. Cushions, skipping the spans occupied by pocket jaws.
    const hx = this.table.length / 2;
    const hz = this.table.width / 2;
    const jaw = r * 2.2;

    for (const b of balls) {
      if (b.potted) continue;

      // Short rails. Their only pockets are the four corners.
      const inCornerJawZ = Math.abs(b.pos.z) > hz - jaw;
      if (!inCornerJawZ) {
        if (b.pos.x - r < -hx) {
          b.pos.x = -hx + r;
          this.bounce(b, 'x');
        } else if (b.pos.x + r > hx) {
          b.pos.x = hx - r;
          this.bounce(b, 'x');
        }
      }

      // Long rails. Corners at both ends, side pockets at the middle.
      const inCornerJawX = Math.abs(b.pos.x) > hx - jaw;
      const inSideJawX = Math.abs(b.pos.x) < jaw;
      if (!inCornerJawX && !inSideJawX) {
        if (b.pos.z - r < -hz) {
          b.pos.z = -hz + r;
          this.bounce(b, 'z');
        } else if (b.pos.z + r > hz) {
          b.pos.z = hz - r;
          this.bounce(b, 'z');
        }
      }
    }

    // 4. Ball on ball. Equal masses, so the normal components simply swap,
    //    scaled by restitution.
    const live = balls.filter((b) => !b.potted);
    for (let i = 0; i < live.length; i += 1) {
      for (let j = i + 1; j < live.length; j += 1) {
        const a = live[i];
        const b = live[j];
        const d = sub(b.pos, a.pos);
        const dist = len(d);
        const min = r * 2;
        if (dist === 0 || dist >= min) continue;

        const nx = d.x / dist;
        const nz = d.z / dist;

        // Separate first, or the pair sticks and jitters.
        const overlap = (min - dist) / 2;
        a.pos.x -= nx * overlap;
        a.pos.z -= nz * overlap;
        b.pos.x += nx * overlap;
        b.pos.z += nz * overlap;

        const relative = dot({ x: b.vel.x - a.vel.x, z: b.vel.z - a.vel.z }, { x: nx, z: nz });
        if (relative > 0) continue; // already separating

        const impulse = -(1 + TUNING.ballRestitution) * relative * 0.5;
        a.vel.x -= impulse * nx;
        a.vel.z -= impulse * nz;
        b.vel.x += impulse * nx;
        b.vel.z += impulse * nz;

        if (Math.abs(relative) > 0.25) {
          this.events.push({
            type: 'ball-ball',
            intensity: Math.abs(relative),
            at: { x: a.pos.x + nx * r, z: a.pos.z + nz * r },
          });
        }
      }
    }
  }

  private bounce(b: Ball, axis: 'x' | 'z'): void {
    const normalSpeed = Math.abs(axis === 'x' ? b.vel.x : b.vel.z);
    if (axis === 'x') {
      b.vel.x = -b.vel.x * TUNING.cushionRestitution;
      b.vel.z *= TUNING.cushionTangentialDamping;
    } else {
      b.vel.z = -b.vel.z * TUNING.cushionRestitution;
      b.vel.x *= TUNING.cushionTangentialDamping;
    }
    if (normalSpeed > 0.2) {
      this.events.push({ type: 'cushion', intensity: normalSpeed, at: { ...b.pos } });
    }
  }
}
