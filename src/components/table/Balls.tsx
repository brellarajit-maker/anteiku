'use client';

/**
 * Renders the solver's state.
 *
 * One mesh per ball, sharing a single sphere geometry — sixteen draw calls, and
 * in exchange each ball gets its own texture so the numbers are real. Positions
 * and orientations are written directly to the transforms every frame; React
 * never re-renders for ball movement.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { POOL_TABLE, type PoolSim } from '@/lib/pool/physics';
import { ballTexture } from '@/lib/pool/appearance';

const R = POOL_TABLE.ballRadius;
/** How far a potted ball sinks, and how long it takes. */
const DROP_DEPTH = 0.14;
const DROP_SECONDS = 0.42;

export function Balls({ sim }: { sim: PoolSim }) {
  const meshes = useRef<Array<THREE.Mesh | null>>([]);
  /** Seconds elapsed since each ball was potted, keyed by ball id. */
  const dropping = useRef<Map<string, number>>(new Map());

  const geometry = useMemo(() => new THREE.SphereGeometry(R, 48, 32), []);

  const materials = useMemo(
    () =>
      sim.balls.map(
        (b) =>
          new THREE.MeshPhysicalMaterial({
            map: ballTexture(b.number),
            roughness: 0.11,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.03,
            envMapIntensity: 1.1,
          }),
      ),
    [sim],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    },
    [geometry, materials],
  );

  useFrame((_, delta) => {
    sim.balls.forEach((ball, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;

      if (ball.potted) {
        const elapsed = (dropping.current.get(ball.id) ?? 0) + delta;
        dropping.current.set(ball.id, elapsed);

        if (elapsed >= DROP_SECONDS) {
          mesh.visible = false;
          return;
        }
        // Ease into the pocket, accelerating as it falls.
        const t = elapsed / DROP_SECONDS;
        const fall = t * t;
        const target = ball.pottedInto ?? ball.pos;
        mesh.position.set(
          THREE.MathUtils.lerp(ball.pos.x, target.x, Math.min(1, t * 2)),
          R - (R + DROP_DEPTH) * fall,
          THREE.MathUtils.lerp(ball.pos.z, target.z, Math.min(1, t * 2)),
        );
        mesh.quaternion.set(...ball.quat);
        return;
      }

      // Forget any earlier drop, or a ball potted again after a re-rack or a
      // respot reads the old elapsed time and vanishes instead of falling.
      dropping.current.delete(ball.id);
      mesh.visible = true;
      mesh.position.set(ball.pos.x, R, ball.pos.z);
      mesh.quaternion.set(...ball.quat);
    });
  });

  return (
    <group>
      {sim.balls.map((ball, i) => (
        <mesh
          key={ball.id}
          ref={(node) => {
            meshes.current[i] = node;
          }}
          geometry={geometry}
          material={materials[i]}
          position={[ball.pos.x, R, ball.pos.z]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
