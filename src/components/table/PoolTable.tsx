'use client';

/**
 * The table: slate, baize, cushions with real pocket mouths, walnut rails and
 * brass sights.
 *
 * Dimensions come from `POOL_TABLE`, so the thing you see and the thing the
 * solver steps can never drift apart. Cushions are built as six segments rather
 * than four walls, because a pocket needs an actual gap — otherwise a ball
 * rattles off the rail that runs past the jaw instead of dropping.
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { POOL_TABLE } from '@/lib/pool/physics';
import { clothTexture, railTexture } from '@/lib/pool/appearance';

const HX = POOL_TABLE.length / 2;
const HZ = POOL_TABLE.width / 2;

/** Visual-only dimensions, in metres. */
const CUSHION_HEIGHT = 0.037;
const CUSHION_DEPTH = 0.038;
const RAIL_WIDTH = 0.1;
const RAIL_HEIGHT = 0.046;
const APRON_DEPTH = 0.2;
/** Half-widths of the pocket mouths, a little wider than the capture radii. */
const CORNER_GAP = 0.078;
const SIDE_GAP = 0.068;

/** Outer edge of the woodwork — the table's true footprint. */
const OUTER_X = HX + CUSHION_DEPTH + RAIL_WIDTH;
const OUTER_Z = HZ + CUSHION_DEPTH + RAIL_WIDTH;

export const TABLE_VISUAL = {
  cushionHeight: CUSHION_HEIGHT,
  railHeight: RAIL_HEIGHT,
  outerX: OUTER_X,
  outerZ: OUTER_Z,
} as const;

export function PoolTable() {
  const cloth = useMemo(() => clothTexture(), []);
  const wood = useMemo(() => railTexture(), []);

  const clothMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloth.map,
        roughnessMap: cloth.rough,
        roughness: 0.92,
        metalness: 0,
        color: '#ffffff',
      }),
    [cloth],
  );

  const cushionMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloth.map,
        roughness: 0.88,
        metalness: 0,
        // Same cloth as the bed. The cushions read brighter than the slate
        // anyway because they face the lamp, so tinting them lifts them into
        // neon — leave the colour to the lighting.
        color: '#ffffff',
      }),
    [cloth],
  );

  const railMaterial = useMemo(() => {
    const t = wood.clone();
    t.needsUpdate = true;
    t.repeat.set(3, 1);
    return new THREE.MeshStandardMaterial({
      map: t,
      roughness: 0.34,
      metalness: 0.08,
      color: '#ffffff',
    });
  }, [wood]);

  const brassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d6b46a',
        roughness: 0.28,
        metalness: 0.95,
      }),
    [],
  );

  /** The well. Black, as a real pocket is — it is a hole with netting in it. */
  const pocketMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000000', roughness: 1, metalness: 0 }),
    [],
  );

  /**
   * The mouth. Also black, but as rubber rather than a void: a little sheen so
   * the rim still catches the lamp and the opening keeps a defined edge.
   */
  const pocketRimMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a0b0b', roughness: 0.55, metalness: 0.08 }),
    [],
  );

  /**
   * The bed, with the pockets cut out.
   *
   * Built in the XY plane then laid flat, so a hole at shape (x, y) ends up at
   * world (x, 0, −y) — hence the negated z. The UVs that `ShapeGeometry`
   * generates are in metres, so they are renormalised to 0–1 afterwards and the
   * cloth texture's existing repeat keeps working unchanged.
   */
  const clothGeometry = useMemo(() => {
    const halfX = (POOL_TABLE.length + CUSHION_DEPTH * 2) / 2;
    const halfZ = (POOL_TABLE.width + CUSHION_DEPTH * 2) / 2;

    const bed = new THREE.Shape();
    bed.moveTo(-halfX, -halfZ);
    bed.lineTo(halfX, -halfZ);
    bed.lineTo(halfX, halfZ);
    bed.lineTo(-halfX, halfZ);
    bed.closePath();

    for (const pocket of POOL_TABLE.pockets) {
      const hole = new THREE.Path();
      hole.absarc(pocket.pos.x, -pocket.pos.z, pocket.capture * 1.12, 0, Math.PI * 2, true);
      bed.holes.push(hole);
    }

    const geometry = new THREE.ShapeGeometry(bed, 18);
    const uv = geometry.attributes.uv;
    const position = geometry.attributes.position;
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(
        i,
        (position.getX(i) + halfX) / (halfX * 2),
        (position.getY(i) + halfZ) / (halfZ * 2),
      );
    }
    uv.needsUpdate = true;
    return geometry;
  }, []);

  // Textures are cached module-side and shared, so only the materials, the one
  // cloned rail map and the bed geometry belong to this component.
  useEffect(
    () => () => {
      clothGeometry.dispose();
      clothMaterial.dispose();
      cushionMaterial.dispose();
      railMaterial.map?.dispose();
      railMaterial.dispose();
      brassMaterial.dispose();
      pocketMaterial.dispose();
      pocketRimMaterial.dispose();
    },
    [
      clothGeometry,
      clothMaterial,
      cushionMaterial,
      railMaterial,
      brassMaterial,
      pocketMaterial,
      pocketRimMaterial,
    ],
  );

  /** Each cushion as [centreX, centreZ, spanX, spanZ]. */
  const cushions = useMemo(() => {
    const endSpan = POOL_TABLE.width - CORNER_GAP * 2;
    const sideSpan = HX - CORNER_GAP - SIDE_GAP;
    const sideCentre = SIDE_GAP + sideSpan / 2;
    return [
      // Short rails.
      [-HX - CUSHION_DEPTH / 2, 0, CUSHION_DEPTH, endSpan],
      [HX + CUSHION_DEPTH / 2, 0, CUSHION_DEPTH, endSpan],
      // Long rails, split either side of the side pockets.
      [-sideCentre, -HZ - CUSHION_DEPTH / 2, sideSpan, CUSHION_DEPTH],
      [sideCentre, -HZ - CUSHION_DEPTH / 2, sideSpan, CUSHION_DEPTH],
      [-sideCentre, HZ + CUSHION_DEPTH / 2, sideSpan, CUSHION_DEPTH],
      [sideCentre, HZ + CUSHION_DEPTH / 2, sideSpan, CUSHION_DEPTH],
    ] as const;
  }, []);

  /** Brass sights: six down each long rail, three across each short rail. */
  const sights = useMemo(() => {
    const out: Array<[number, number]> = [];
    const railZ = HZ + CUSHION_DEPTH + RAIL_WIDTH / 2;
    const railX = HX + CUSHION_DEPTH + RAIL_WIDTH / 2;
    for (const i of [-3, -2, -1, 1, 2, 3]) {
      const x = (i * POOL_TABLE.length) / 8;
      out.push([x, -railZ], [x, railZ]);
    }
    for (const i of [-1, 0, 1]) {
      const z = (i * POOL_TABLE.width) / 4;
      out.push([-railX, z], [railX, z]);
    }
    return out;
  }, []);

  const outerX = OUTER_X;
  const outerZ = OUTER_Z;

  return (
    <group>
      {/* Baize, at exactly y = 0 so a ball at y = r rests on it. Six holes are
          cut out of it — without them the cloth is a solid sheet and the pocket
          wells below are simply hidden, which is why the pockets read as vague
          dark patches rather than openings. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        material={clothMaterial}
        geometry={clothGeometry}
      />

      {/* Rubber rim around each mouth, so the opening has a defined edge. */}
      {POOL_TABLE.pockets.map((p, i) => (
        <mesh
          key={`rim-${i}`}
          position={[p.pos.x, 0.002, p.pos.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={pocketRimMaterial}
        >
          <torusGeometry args={[p.capture * 1.12, 0.009, 10, 28]} />
        </mesh>
      ))}

      {/* Pocket mouths — dark wells, so a potted ball drops into something. */}
      {POOL_TABLE.pockets.map((p, i) => (
        <mesh
          key={`pocket-${i}`}
          position={[p.pos.x, -0.082, p.pos.z]}
          material={pocketMaterial}
        >
          {/* Tapers in from the hole's own radius, so the cut edge reads as the
              rim of a funnel rather than a disc floating under the cloth. */}
          <cylinderGeometry args={[p.capture * 1.12, p.capture * 0.82, 0.17, 20, 1, true]} />
        </mesh>
      ))}
      {POOL_TABLE.pockets.map((p, i) => (
        <mesh
          key={`pocket-floor-${i}`}
          position={[p.pos.x, -0.125, p.pos.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={pocketMaterial}
        >
          <circleGeometry args={[p.capture * 1.25, 20]} />
        </mesh>
      ))}

      {/* Cushions. */}
      {cushions.map(([cx, cz, sx, sz], i) => (
        <mesh
          key={`cushion-${i}`}
          position={[cx, CUSHION_HEIGHT / 2, cz]}
          castShadow
          receiveShadow
          material={cushionMaterial}
        >
          <boxGeometry args={[sx, CUSHION_HEIGHT, sz]} />
        </mesh>
      ))}

      {/* Walnut rails, mitred as four overlapping bars. */}
      {(
        [
          [0, -outerZ + RAIL_WIDTH / 2, outerX * 2, RAIL_WIDTH],
          [0, outerZ - RAIL_WIDTH / 2, outerX * 2, RAIL_WIDTH],
          [-outerX + RAIL_WIDTH / 2, 0, RAIL_WIDTH, outerZ * 2],
          [outerX - RAIL_WIDTH / 2, 0, RAIL_WIDTH, outerZ * 2],
        ] as const
      ).map(([cx, cz, sx, sz], i) => (
        <mesh
          key={`rail-${i}`}
          position={[cx, RAIL_HEIGHT / 2, cz]}
          castShadow
          receiveShadow
          material={railMaterial}
        >
          <boxGeometry args={[sx, RAIL_HEIGHT, sz]} />
        </mesh>
      ))}

      {/* Brass sights, flush into the rail tops. */}
      {sights.map(([x, z], i) => (
        <mesh
          key={`sight-${i}`}
          position={[x, RAIL_HEIGHT + 0.0005, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={brassMaterial}
        >
          <circleGeometry args={[0.0075, 12]} />
        </mesh>
      ))}

      {/* Apron and legs, for the frames where the camera drops near the rail.
          Its top is held 6 mm under the baize: level with it, the apron's top
          face wins the depth test and the bed renders as walnut. */}
      <mesh position={[0, -APRON_DEPTH / 2 - 0.006, 0]} material={railMaterial} castShadow>
        <boxGeometry args={[outerX * 2 - 0.004, APRON_DEPTH, outerZ * 2 - 0.004]} />
      </mesh>
      {(
        [
          [-outerX + 0.12, -outerZ + 0.12],
          [outerX - 0.12, -outerZ + 0.12],
          [-outerX + 0.12, outerZ - 0.12],
          [outerX - 0.12, outerZ - 0.12],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, -APRON_DEPTH - 0.3, z]} material={railMaterial}>
          <boxGeometry args={[0.13, 0.6, 0.13]} />
        </mesh>
      ))}
    </group>
  );
}
