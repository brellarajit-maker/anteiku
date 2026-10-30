'use client';

/**
 * The canvas, and everything that decides whether there should be one.
 *
 * Rendering stops the moment the hero leaves the viewport or the tab goes to
 * the background, and never starts at all without WebGL — in which case the
 * static fallback underneath is what the visitor sees, with the copy and the
 * buttons unchanged.
 */

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TableScene, type Phase } from './TableScene';
import {
  useDeviceTier,
  useIsActive,
  usePortrait,
  useReducedMotion,
} from '@/lib/hooks/useEnvironment';

export interface TableStageProps {
  armed?: boolean;
  /** Increment to play the camera hand-off — see `TableScene`. */
  pushIn?: number;
  onPhaseChange?: (phase: Phase) => void;
  onPot?: (ballId: string) => void;
  className?: string;
}

export function TableStage({
  armed = true,
  pushIn = 0,
  onPhaseChange,
  onPot,
  className,
}: TableStageProps) {
  const host = useRef<HTMLDivElement>(null);
  const active = useIsActive(host);
  const tier = useDeviceTier();
  const portrait = usePortrait();
  const reducedMotion = useReducedMotion();

  return (
    <div ref={host} className={className} aria-hidden="true">
      {tier !== 'none' && (
        <Canvas
          frameloop={active ? 'always' : 'never'}
          // Cap the pixel ratio: a 3× phone screen renders nine times the
          // pixels of a 1× one for no visible gain on a dark scene.
          dpr={tier === 'high' ? [1, 1.75] : [1, 1.35]}
          shadows={tier === 'high'}
          gl={{
            antialias: tier === 'high',
            powerPreference: 'high-performance',
            alpha: true,
            // The hero sits over a dark page; no need to keep the buffer.
            preserveDrawingBuffer: false,
            // Declared here rather than assigned to the renderer inside the
            // scene: the room is meant to be dark, with the cloth the
            // brightest thing in it rather than everything legible at once.
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.86,
          }}
          camera={{ position: [0.1, 3.4, 2.9], fov: 32, near: 0.1, far: 50 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            <TableScene
              armed={armed}
              pushIn={pushIn}
              portrait={portrait}
              reducedMotion={reducedMotion}
              quality={tier === 'high' ? 'high' : 'low'}
              onPhaseChange={onPhaseChange}
              onPot={onPot}
            />
            {tier === 'high' && !reducedMotion && (
              <EffectComposer enableNormalPass={false}>
                {/* Just the lamp's hotspots and the gloss on the balls. */}
                <Bloom
                  intensity={0.24}
                  luminanceThreshold={0.86}
                  luminanceSmoothing={0.3}
                  mipmapBlur
                />
                <Vignette offset={0.22} darkness={0.7} eskil={false} />
              </EffectComposer>
            )}
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
