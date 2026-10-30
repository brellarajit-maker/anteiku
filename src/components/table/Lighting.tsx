'use client';

/**
 * The room.
 *
 * A billiards hall is one bright pool of light in a dark room, and that single
 * fact does most of the work here: a low overhead key over the table, a cool
 * fill from the far side to keep the far rail from going black, and a
 * procedural environment so the balls have something to reflect.
 *
 * The environment is built from `Lightformer` rectangles rather than an HDR
 * file. That keeps the glossy reflections — the main thing that sells resin
 * balls — without putting a multi-megabyte texture download on the hero's
 * critical path.
 */

import { Environment, Lightformer } from '@react-three/drei';
import { POOL_TABLE } from '@/lib/pool/physics';

export function Lighting({ shadows = true }: { shadows?: boolean }) {
  return (
    <>
      {/* Enough ambient to read the walnut, not enough to lift the darkness. */}
      <ambientLight intensity={0.11} color="#9fb4a8" />

      {/*
        The lamp. Two shades in a row rather than one, which is how a real
        table is lit and the reason the cloth has a long bright spine instead
        of one blown-out circle in the middle.
      */}
      {[-0.52, 0.52].map((x) => (
        <spotLight
          key={x}
          // High and fully soft-edged. Lower down, the cone lands as a hard
          // bright disc on the cloth and the table reads as a stage, not a room.
          position={[x, 2.15, 0]}
          angle={0.64}
          penumbra={1}
          intensity={12}
          distance={6.5}
          decay={1.9}
          color="#ffe6bd"
          castShadow={shadows}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0012}
          shadow-normalBias={0.012}
        />
      ))}

      {/* Cool bounce from the room, keeping the far rail legible. */}
      <directionalLight position={[-2.4, 1.1, -2.2]} intensity={0.22} color="#5f93a8" />

      {/* Emerald spill off the cloth onto the underside of the rails. */}
      <pointLight position={[0, 0.2, 0]} intensity={0.4} distance={1.8} decay={2} color="#126b45" />

      <Environment resolution={256} frames={1} background={false}>
        {/* The lamp's shade, as the balls see it. */}
        <Lightformer
          form="rect"
          intensity={6}
          color="#ffe9c4"
          position={[0, 1.4, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[POOL_TABLE.length * 0.6, POOL_TABLE.width * 0.6, 1]}
        />
        {/* Long soft strips either side — the windows of the room. */}
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#2e5f74"
          position={[0, 0.5, -2.6]}
          rotation={[0, 0, 0]}
          scale={[5, 1.4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#163a2a"
          position={[0, 0.5, 2.6]}
          rotation={[0, Math.PI, 0]}
          scale={[5, 1.4, 1]}
        />
        {/* A dim floor, so the balls are not black underneath. */}
        <Lightformer
          form="rect"
          intensity={0.25}
          color="#0d1512"
          position={[0, -1.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[6, 4, 1]}
        />
      </Environment>
    </>
  );
}
