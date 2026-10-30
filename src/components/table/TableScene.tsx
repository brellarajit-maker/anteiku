'use client';

/**
 * The centrepiece.
 *
 * One scene does all of it: the opening break, the camera move that settles
 * into the hero framing, and then the table you can actually play. There is no
 * second canvas anywhere on the site — the table you land on is the table you
 * take a shot at.
 *
 * The camera is described as an *angle* and a *framing intent*, never as a
 * position. Each frame the distance is solved from the viewport so the table
 * fits with a consistent margin, which is the only way one scene can look
 * composed on an ultrawide monitor and on a phone held upright. GSAP tweens the
 * angles on a plain object; `useFrame` reads it and does the arithmetic, so the
 * timeline and React Three Fiber never fight over the camera.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { POOL_TABLE, PoolSim, rackEightBall, type Vec2 } from '@/lib/pool/physics';
import { PoolTable, TABLE_VISUAL } from './PoolTable';
import { Balls } from './Balls';
import { Lighting } from './Lighting';

export type Phase = 'intro' | 'breaking' | 'ready' | 'aiming' | 'shooting';

const R = POOL_TABLE.ballRadius;

/** Hardest shot a visitor can play, m/s. A real break is around 7–8. */
const MAX_SHOT_SPEED = 7.2;
/** Drag distance, in metres on the cloth, that reaches full power. */
const MAX_DRAG = 0.62;

const DEG = Math.PI / 180;

/** How far the pointer swings the camera around the table, in degrees. */
const ORBIT_AZIMUTH = 30;
/** And how far it raises or lowers it. */
const ORBIT_ELEVATION = 11;

interface Framing {
  /** Degrees above the cloth. 90 would be straight down. */
  elevation: number;
  /** Degrees off the near rail, for a touch of asymmetry. */
  azimuth: number;
  fov: number;
  /** Extra distance beyond a snug fit. 1 = the table just fits. */
  distanceScale: number;
}

/**
 * Note there is no vertical bias here. Dropping the table down the frame to
 * clear the headline is done by positioning the canvas element itself in the
 * layout, which is exact and costs nothing — biasing the look-at point instead
 * means the fit solver and the bias pull against each other, and the table ends
 * up either cropped or tiny.
 */
const FRAMING: Record<'intro' | 'hero', Framing> = {
  intro: { elevation: 74, azimuth: 4, fov: 30, distanceScale: 1.38 },
  hero: { elevation: 55, azimuth: 0, fov: 33, distanceScale: 1.02 },
};

/**
 * Portrait keeps the same camera angle — the table itself is rotated a quarter
 * turn (see the group below), so its long axis runs down a tall screen and the
 * balls stay the same size on a phone as on a laptop.
 */
const PORTRAIT_FRAMING: Record<'intro' | 'hero', Framing> = {
  intro: { elevation: 76, azimuth: 4, fov: 36, distanceScale: 1.3 },
  hero: { elevation: 62, azimuth: 0, fov: 40, distanceScale: 1.04 },
};

export interface TableSceneProps {
  /** Skip the break and open on a table that has already been played. */
  reducedMotion?: boolean;
  portrait?: boolean;
  /** Shadows and the heavier lamp are dropped on weak hardware. */
  quality?: 'high' | 'low';
  onPhaseChange?: (phase: Phase) => void;
  /** Fires on every pot so the hero can keep a tally. */
  onPot?: (ballId: string) => void;
  /** Set by the parent to run the break on demand (after the loader). */
  armed?: boolean;
  /**
   * Increment to play the hand-off: the camera drops and pushes in on the
   * table, then eases back. Used when the hero's booking button is pressed, so
   * the table passes the visitor down to the booking panel rather than the
   * page simply jumping.
   */
  pushIn?: number;
}

export function TableScene({
  reducedMotion = false,
  portrait = false,
  quality = 'high',
  onPhaseChange,
  onPot,
  armed = true,
  pushIn = 0,
}: TableSceneProps) {
  const camera = useThree((state) => state.camera);

  const sim = useMemo(() => new PoolSim(POOL_TABLE, rackEightBall(POOL_TABLE)), []);

  const framing = portrait ? PORTRAIT_FRAMING : FRAMING;

  /** What GSAP tweens. Read every frame; never written to the camera directly. */
  const rig = useRef({ ...framing.intro, targetY: 0, timeScale: 1 });

  const phase = useRef<Phase>('intro');
  const setPhase = useCallback(
    (next: Phase) => {
      if (phase.current === next) return;
      phase.current = next;
      onPhaseChange?.(next);
    },
    [onPhaseChange],
  );

  /** Damped pointer offset, in normalised device coords. */
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  /** Live aim, while the visitor is dragging. */
  const [aim, setAim] = useState<{ dir: Vec2; power: number } | null>(null);
  const dragStart = useRef<Vec2 | null>(null);

  const cueGroup = useRef<THREE.Group>(null);
  const guide = useRef<THREE.Mesh>(null);

  /* ---------------------------------------------------------------------
     Opening sequence
  --------------------------------------------------------------------- */

  useEffect(() => {
    if (!armed) return;

    // The table is rotated in portrait, so "down the table" flips with it.
    const breakDirection: Vec2 = { x: 1, z: 0.035 };

    if (reducedMotion) {
      // Produce a real settled spread rather than faking one: play the break
      // headlessly, then open on the result.
      sim.strike(breakDirection, 7.6);
      let guard = 0;
      while (!sim.settled && guard < 8000) {
        sim.step(1 / 120);
        guard += 1;
      }
      sim.events.length = 0;
      Object.assign(rig.current, framing.hero, { targetY: 0, timeScale: 1 });
      setPhase('ready');
      return;
    }

    Object.assign(rig.current, framing.intro, { targetY: 0, timeScale: 1 });

    const tl = gsap.timeline();

    // 1. Drift in from above while the cue lines up.
    tl.to(rig.current, {
      elevation: framing.intro.elevation - 8,
      distanceScale: framing.intro.distanceScale - 0.16,
      duration: 1.5,
      ease: 'power2.inOut',
    });

    // 2. Strike, and drop into slow motion as the rack goes.
    tl.call(() => {
      sim.strike(breakDirection, 7.6);
      setPhase('breaking');
    });
    tl.to(rig.current, { timeScale: 0.34, duration: 0.18, ease: 'power2.out' });

    // 3. Follow the spread, then settle into the hero framing.
    tl.to(
      rig.current,
      {
        ...framing.hero,
        duration: 2.5,
        ease: 'power2.inOut',
      },
      '>-0.1',
    );
    tl.to(rig.current, { timeScale: 1, duration: 1.1, ease: 'power1.inOut' }, '<0.5');
    tl.call(() => setPhase('ready'));

    return () => {
      tl.kill();
    };
    // `framing` is derived from `portrait`, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, reducedMotion, portrait, sim, setPhase]);

  /* ---------------------------------------------------------------------
     The hand-off

     Short on purpose. The visitor has just asked to book — they are on their
     way somewhere, and a long cinematic would be in the way rather than in
     the experience.
  --------------------------------------------------------------------- */

  useEffect(() => {
    if (pushIn === 0 || reducedMotion) return;

    const target = framing.hero;
    const tl = gsap.timeline();
    tl.to(rig.current, {
      elevation: target.elevation - 14,
      fov: target.fov - 5,
      distanceScale: target.distanceScale - 0.13,
      duration: 0.62,
      ease: 'power2.inOut',
    }).to(rig.current, {
      ...target,
      duration: 1.15,
      ease: 'power2.out',
    });

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushIn, reducedMotion]);

  /* ---------------------------------------------------------------------
     Pointer handling

     The invisible plane below covers the whole slate and reports hits in world
     space. The table group is rotated in portrait, so hits are converted back
     into table space before they reach the solver.
  --------------------------------------------------------------------- */

  const toTableSpace = useCallback(
    (point: THREE.Vector3): Vec2 =>
      portrait ? { x: point.z, z: -point.x } : { x: point.x, z: point.z },
    [portrait],
  );

  const cueBallPos = (): Vec2 | null => {
    const cue = sim.cueBall;
    return cue && !cue.potted ? cue.pos : null;
  };

  /**
   * Slingshot: the further the pointer is pulled from the cue ball, the harder
   * the shot, and it fires back along that line.
   */
  const aimFrom = (point: THREE.Vector3): { dir: Vec2; power: number } | null => {
    const cue = cueBallPos();
    if (!cue) return null;
    const hit = toTableSpace(point);
    const pulled = { x: cue.x - hit.x, z: cue.z - hit.z };
    const distance = Math.hypot(pulled.x, pulled.z);
    if (distance < 1e-4) return null;
    return {
      dir: { x: pulled.x / distance, z: pulled.z / distance },
      power: Math.min(1, distance / MAX_DRAG),
    };
  };

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    pointer.current.tx = e.pointer.x * 0.5;
    pointer.current.ty = e.pointer.y * 0.5;

    if (!dragStart.current) return;
    const next = aimFrom(e.point);
    if (next) setAim(next);
  };

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    if (phase.current !== 'ready') return;
    if (!cueBallPos()) return;
    dragStart.current = toTableSpace(e.point);
    setPhase('aiming');
  };

  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    if (!dragStart.current) return;
    dragStart.current = null;

    // Prefer the live aim, but fall back to the release point. A fast flick
    // can produce a pointerdown and a pointerup with no move between them,
    // and the shot should still happen — the release point is what the power
    // was always measured from anyway.
    const shot = aim ?? aimFrom(e.point);

    if (shot && shot.power > 0.06) {
      sim.strike(shot.dir, MAX_SHOT_SPEED * shot.power);
      setPhase('shooting');
    } else {
      setPhase('ready');
    }
    setAim(null);
  };

  /**
   * The browser took the gesture over — on a phone, a finger that starts on
   * the table and drags up is a scroll. Neither pointerup nor pointerleave
   * fires then, so without this the table stays stuck in `aiming` for good.
   */
  const handleCancel = () => {
    dragStart.current = null;
    setAim(null);
    setPhase('ready');
  };

  /** Re-rack once the table is mostly cleared, so it is never left dead. */
  const rerackAt = useRef<number | null>(null);

  /* ---------------------------------------------------------------------
     Frame loop
  --------------------------------------------------------------------- */

  useFrame((state, delta) => {
    const clamped = Math.min(delta, 1 / 20);

    sim.step(clamped, rig.current.timeScale);

    let shake = 0;
    for (const event of sim.events) {
      if (event.type === 'pot' && event.ballId) onPot?.(event.ballId);
      if (event.type === 'ball-ball') shake = Math.max(shake, event.intensity);
    }
    sim.events.length = 0;

    if (phase.current === 'shooting' && sim.settled) setPhase('ready');

    /* --- Camera -------------------------------------------------------- */

    const perspective = camera as THREE.PerspectiveCamera;
    const { elevation, azimuth, fov, distanceScale } = rig.current;

    if (perspective.isPerspectiveCamera && Math.abs(perspective.fov - fov) > 1e-4) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }

    const vFov = fov * DEG;
    const aspect = perspective.isPerspectiveCamera ? perspective.aspect : 1.6;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    // Footprint as the camera sees it. The table is turned a quarter turn in
    // portrait, so its long axis runs along world Z there.
    const footprintX = (portrait ? TABLE_VISUAL.outerZ : TABLE_VISUAL.outerX) * 2;
    const footprintZ = (portrait ? TABLE_VISUAL.outerX : TABLE_VISUAL.outerZ) * 2;

    // Orbit. The pointer swings the camera around the table rather than
    // sliding it sideways, so the table reads as a solid object being walked
    // around. Damped in `pointer`, and clamped so it can never drop below the
    // rail or tip over the top.
    const nudge = phase.current === 'ready' || phase.current === 'aiming' ? 1 : 0.22;
    const p = pointer.current;
    p.x += (p.tx - p.x) * Math.min(1, clamped * 2.4);
    p.y += (p.ty - p.y) * Math.min(1, clamped * 2.4);

    const elevationRad =
      THREE.MathUtils.clamp(elevation + p.y * ORBIT_ELEVATION * nudge, 22, 86) * DEG;
    // Looking down, depth foreshortens by sin(elevation); keep a little of the
    // true depth so a near-overhead framing does not collapse to nothing.
    const projectedHalfHeight =
      (footprintZ / 2) * Math.max(0.35, Math.sin(elevationRad)) + R * 6;
    // Swinging round widens the table's silhouette, so ask for a little more
    // room than the straight-on footprint or the corners clip on a big swing.
    const swing = Math.abs(p.x) * nudge;
    const requiredHalfWidth = (footprintX / 2) * (1 + swing * 0.14);

    const MARGIN = 1.1;
    const distance =
      Math.max(
        (requiredHalfWidth * MARGIN) / Math.tan(hFov / 2),
        (projectedHalfHeight * MARGIN) / Math.tan(vFov / 2),
      ) * distanceScale;

    const targetY = rig.current.targetY;
    const azimuthRad = (azimuth + p.x * ORBIT_AZIMUTH * nudge) * DEG;
    const horizontal = Math.cos(elevationRad) * distance;
    const jolt = shake > 0 ? Math.min(0.01, shake * 0.0018) : 0;

    camera.position.set(
      Math.sin(azimuthRad) * horizontal + (Math.random() - 0.5) * jolt,
      Math.sin(elevationRad) * distance + targetY,
      Math.cos(azimuthRad) * horizontal + (Math.random() - 0.5) * jolt,
    );
    camera.lookAt(0, targetY, 0);

    /* --- Cue and guide -------------------------------------------------- */

    const cue = cueBallPos();
    // Table space → world space, undoing the portrait rotation.
    const toWorld = (v: Vec2): [number, number] => (portrait ? [-v.z, v.x] : [v.x, v.z]);

    if (cueGroup.current) {
      // Only while a shot is being lined up — a cue lying on the cloth the rest
      // of the time just reads as a stray object.
      const visible = Boolean(cue) && phase.current === 'aiming';
      cueGroup.current.visible = visible;
      if (visible && cue) {
        const dir = aim?.dir ?? { x: 1, z: 0 };
        const power = aim?.power ?? 0;
        const [wx, wz] = toWorld(cue);
        cueGroup.current.position.set(wx, R, wz);
        cueGroup.current.rotation.y = Math.atan2(-dir.z, dir.x);
        const idle = Math.sin(state.clock.elapsedTime * 1.1) * 0.004;
        cueGroup.current.children[0].position.x = -(0.83 + power * 0.34 + idle);
      }
    }

    if (guide.current) {
      const showing = phase.current === 'aiming' && Boolean(aim) && Boolean(cue);
      guide.current.visible = showing;
      if (showing && cue && aim) {
        const length = 0.3 + aim.power * 1.5;
        const [wx, wz] = toWorld(cue);
        guide.current.position.set(wx, 0.0015, wz);
        guide.current.rotation.set(-Math.PI / 2, 0, -Math.atan2(-aim.dir.z, aim.dir.x));
        guide.current.scale.set(length, 1, 1);
        (guide.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + aim.power * 0.55;
      }
    }

    /* --- Idle re-rack --------------------------------------------------- */

    if (phase.current === 'ready' && sim.settled) {
      sim.respotCue();

      const potted = sim.balls.filter((b) => b.potted).length;
      if (potted >= 6) {
        rerackAt.current ??= state.clock.elapsedTime + 2.5;
        if (state.clock.elapsedTime > rerackAt.current) {
          sim.reset(rackEightBall(POOL_TABLE));
          rerackAt.current = null;
        }
      } else {
        rerackAt.current = null;
      }
    }
  });

  return (
    <>
      <Lighting shadows={quality === 'high'} />

      {/* Everything that belongs to the table turns together in portrait. */}
      <group rotation={[0, portrait ? Math.PI / 2 : 0, 0]}>
        <PoolTable />
        <Balls sim={sim} />
      </group>

      {/* Cue and guide live in world space; positions are converted above. */}
      <group ref={cueGroup} visible={false}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.0065, 0.013, 1.45, 16]} />
          <meshStandardMaterial color="#4a3324" roughness={0.3} metalness={0.05} />
        </mesh>
      </group>

      <mesh ref={guide} visible={false}>
        <planeGeometry args={[1, 0.004]} />
        <meshBasicMaterial
          color="#d6b46a"
          transparent
          opacity={0.4}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pointer catcher: wide enough that a drag leaving the cloth still
          tracks, and flat on the bed so hits read as table coordinates. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.0005, 0]}
        onPointerMove={handleMove}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
        onPointerCancel={handleCancel}
      >
        <planeGeometry args={[POOL_TABLE.length * 2.2, POOL_TABLE.length * 2.2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}
