'use client';

/**
 * One WebGL context for every 3D object outside the hero.
 *
 * The brief asks for 3D props in several places at once — in the game cards,
 * beside the hero copy, floating in the sections, and a ball that rides the
 * scroll. Giving each its own `<Canvas>` would mean six or seven WebGL
 * contexts; browsers cap you at around sixteen and start evicting the oldest,
 * and each one carries its own render loop and GPU memory.
 *
 * drei's `View` solves it properly: this single fixed canvas sits behind the
 * page, and each `<Prop3D>` elsewhere hands it a scene plus a DOM element to
 * track. The canvas renders each as its own viewport, scissored to that
 * element's box, following it as the page scrolls.
 *
 * So the whole site runs on exactly two contexts: the hero's table, and this.
 */

import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import * as THREE from 'three';
import { useDeviceTier } from '@/lib/hooks/useEnvironment';

/** False when there is no canvas, so props can render a flat fallback. */
const CanvasReady = createContext(false);
export const useViewCanvas = () => useContext(CanvasReady);

export function ViewCanvas({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const tier = useDeviceTier();
  const enabled = tier === 'high';

  return (
    <CanvasReady.Provider value={enabled}>
      <div ref={root}>
        {children}

        {enabled && (
          <Canvas
            // Events come from the page, not the canvas: the canvas itself is
            // transparent to the pointer so it cannot swallow clicks on links.
            eventSource={root as RefObject<HTMLElement>}
            eventPrefix="client"
            dpr={[1, 1.6]}
            // Every view shares this camera unless it declares its own. At
            // z=3/fov=35 the visible height is about 1.9 units, so a ball of
            // radius 0.5–0.8 sits comfortably inside its box.
            camera={{ position: [0, 0, 3], fov: 35, near: 0.1, far: 20 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'low-power',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1,
            }}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <View.Port />
          </Canvas>
        )}
      </div>
    </CanvasReady.Provider>
  );
}
