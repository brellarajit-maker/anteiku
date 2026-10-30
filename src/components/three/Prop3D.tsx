'use client';

/**
 * Pins a 3D scene to a box on the page.
 *
 * Renders an ordinary div, then tells the shared canvas (see `ViewCanvas`) to
 * draw `children` into exactly that box. The div is what the page lays out; the
 * 3D is drawn over it and follows it as you scroll.
 *
 * `interactive` decides whether the box takes pointer events. Default is off,
 * so a decorative ball floating behind a heading can never eat a click on a
 * link underneath it.
 */

import { useRef, type ReactNode, type RefObject } from 'react';
import { View } from '@react-three/drei';
import { useViewCanvas } from './ViewCanvas';

export function Prop3D({
  children,
  className,
  interactive = false,
  fallback,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  /** Shown instead when there is no canvas — no WebGL, or a weaker device. */
  fallback?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const ready = useViewCanvas();

  if (!ready) return <>{fallback ?? null}</>;

  return (
    <>
      <div
        ref={box}
        className={className}
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        aria-hidden="true"
      />
      {/* React 19 types a ref as possibly null; drei wants it non-nullable.
          The ref is always attached by the time View reads it. */}
      <View track={box as RefObject<HTMLElement>}>{children}</View>
    </>
  );
}
