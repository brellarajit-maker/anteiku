'use client';

/**
 * The emblem, very faint, centred behind a section's content.
 *
 * It cannot be one fixed layer behind the whole page: the sections are opaque
 * by design — that alternating ink/forest rhythm is what gives the page its
 * structure — so anything behind them is simply covered. Instead each section
 * carries its own, centred and turning slowly as that section passes, which
 * reads as a single mark running down the middle of the scroll rather than as
 * a badge stamped in each corner.
 *
 * Purely decorative: aria-hidden, no pointer events, and it sits under the
 * content rather than over it so it can never touch legibility.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/hooks/useEnvironment';

export function Watermark({
  tone = 'ink',
  className,
}: {
  /** The surface behind it — screen blend lifts more off a lighter one. */
  tone?: 'ink' | 'forest';
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const node = host.current;
    if (!node) return;

    gsap.registerPlugin(ScrollTrigger);

    // Tied to scroll position rather than to a clock, so it only ever moves
    // while the visitor is moving.
    const tween = gsap.fromTo(
      node,
      { rotate: -10, yPercent: 4 },
      {
        rotate: 10,
        yPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: node.parentElement ?? node,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <div
      aria-hidden="true"
      ref={host}
      className={`pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[min(52rem,88vw)] -translate-x-1/2 -translate-y-1/2 select-none ${
        className ?? ''
      }`}
    >
      <img
        src="./brand/emblem-1024.webp"
        alt=""
        width={1024}
        height={1024}
        loading="lazy"
        decoding="async"
        // Low enough that it reads as a texture in the surface rather than a
        // picture sitting on it. Centred means it sits behind body copy, so it
        // is fainter than it was out at the margins — and fainter again on the
        // forest sections, where screen blend over a lighter base lifts more.
        className={`w-full mix-blend-screen ${
          tone === 'forest' ? 'opacity-[0.035]' : 'opacity-[0.05]'
        }`}
      />
    </div>
  );
}
