'use client';

/**
 * The 3D objects that live outside the hero: balls, a cue, a brass ring.
 *
 * Each of these is the contents of a `View`, so each is its own little scene
 * and carries its own lights. They are deliberately lit with plain lights
 * rather than a drei `Environment` — an environment map per view would mean
 * rendering a cubemap for each one, and at this size the clearcoat does enough
 * of the work.
 *
 * Ball textures come from the same generator the hero uses, so a number painted
 * on a ball here matches a number on the table exactly.
 */

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ballTexture } from '@/lib/pool/appearance';

/** Lights for one prop view. Warm key from above, emerald bounce below. */
export function PropLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.34 * intensity} color="#cfd8d2" />
      <directionalLight position={[2, 3, 2.5]} intensity={2.6 * intensity} color="#fff1d6" />
      <directionalLight position={[-2, -1, 1]} intensity={0.7 * intensity} color="#126b45" />
      <pointLight position={[0, 0, 2.4]} intensity={1.4 * intensity} color="#ffe6bd" />
    </>
  );
}

function ballMaterial(number: number) {
  return (
    <meshPhysicalMaterial
      map={ballTexture(number)}
      roughness={0.12}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.04}
      envMapIntensity={1}
    />
  );
}

/**
 * A ball that turns on its own, leans toward the cursor, and can be flicked.
 *
 * `spinnable` wires up dragging; leave it off for purely decorative props so
 * they cost nothing but a transform each frame.
 */
export function SpinningBall({
  number = 8,
  radius = 0.5,
  speed = 0.25,
  spinnable = false,
  onPoke,
}: {
  number?: number;
  radius?: number;
  speed?: number;
  spinnable?: boolean;
  onPoke?: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const spin = useRef({ y: speed, x: 0.04 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const d = Math.min(delta, 1 / 20);
    const node = mesh.current;
    if (!node) return;

    if (!dragging.current) {
      // Settle back to the idle turn rather than stopping dead.
      spin.current.y += (speed - spin.current.y) * Math.min(1, 1.1 * d);
      spin.current.x += (0.04 - spin.current.x) * Math.min(1, 1.1 * d);
    }
    node.rotation.y += spin.current.y * d;
    node.rotation.x += spin.current.x * d;

    // A slow bob, and a lean toward wherever the pointer is.
    node.position.y = Math.sin(state.clock.elapsedTime * 0.7) * radius * 0.07;
    node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, state.pointer.x * 0.12, d * 2);
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!spinnable) return;
    dragging.current = true;
    last.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    const dx = (e.clientX ?? 0) - last.current.x;
    const dy = (e.clientY ?? 0) - last.current.y;
    last.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
    spin.current.y = dx * 0.06;
    spin.current.x = dy * 0.06;
  };

  const release = () => {
    dragging.current = false;
  };

  return (
    <mesh
      ref={mesh}
      onPointerDown={spinnable ? onDown : undefined}
      onPointerMove={spinnable ? onMove : undefined}
      onPointerUp={spinnable ? release : undefined}
      onPointerLeave={spinnable ? release : undefined}
      onPointerCancel={spinnable ? release : undefined}
      onClick={
        onPoke
          ? () => {
              spin.current.y += 6;
              onPoke();
            }
          : undefined
      }
    >
      <sphereGeometry args={[radius, 56, 40]} />
      {ballMaterial(number)}
    </mesh>
  );
}

/**
 * The snooker card's composition: a red, the cue ball and the black, parting
 * slightly as the pointer moves across them.
 */
export function BallTrio() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const d = Math.min(delta, 1 / 20);
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.3, d * 2);
    g.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 0.8 + i * 1.6) * 0.045;
      child.rotation.y += (0.16 + i * 0.05) * d;
    });
  });

  return (
    <group ref={group}>
      <mesh position={[-0.52, 0, -0.1]}>
        <sphereGeometry args={[0.3, 40, 28]} />
        {ballMaterial(3)}
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.36, 48, 32]} />
        {ballMaterial(0)}
      </mesh>
      <mesh position={[0.52, 0, -0.1]}>
        <sphereGeometry args={[0.3, 40, 28]} />
        {ballMaterial(8)}
      </mesh>
    </group>
  );
}

/** A cue lying across the frame, turning very slowly. Decorative only. */
export function FloatingCue() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.z = -0.35 + Math.sin(t * 0.35) * 0.06;
    g.rotation.y += delta * 0.1;
    g.position.y = Math.sin(t * 0.6) * 0.06;
  });

  return (
    <group ref={group}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.016, 0.03, 2.6, 20]} />
        <meshStandardMaterial color="#4a3324" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[-1.31, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.017, 0.06, 16]} />
        <meshStandardMaterial color="#2f6f8f" roughness={0.6} />
      </mesh>
      <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0255, 0.026, 0.14, 20]} />
        <meshStandardMaterial color="#d6b46a" roughness={0.28} metalness={0.92} />
      </mesh>
    </group>
  );
}

/** A brass ring, for negative space that wants an object but not another ball. */
export function BrassRing() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const node = mesh.current;
    if (!node) return;
    node.rotation.x += delta * 0.18;
    node.rotation.y += delta * 0.26;
    node.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
  });

  return (
    <mesh ref={mesh}>
      <torusGeometry args={[0.46, 0.055, 24, 80]} />
      <meshStandardMaterial color="#d6b46a" roughness={0.22} metalness={0.98} />
    </mesh>
  );
}
