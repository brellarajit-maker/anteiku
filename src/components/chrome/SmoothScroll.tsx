'use client';

/**
 * Lenis, wired to GSAP's ticker and to ScrollTrigger.
 *
 * Three things have to agree on what "scroll position" means — Lenis, GSAP's
 * ScrollTrigger, and the browser's own anchor jumping. Running Lenis from
 * `gsap.ticker` rather than its own rAF loop means there is one clock, and
 * telling ScrollTrigger to read from Lenis means scroll-driven animations stay
 * locked to the eased position instead of the native one.
 *
 * Anyone who asked for reduced motion gets none of this — native scrolling,
 * which is instant and predictable.
 */

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/hooks/useEnvironment';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (reduced) {
      // Anchors still need to work; the browser handles them natively.
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      // A long, flat tail: the page keeps gliding after the wheel stops, which
      // is what makes a heavy dark site feel expensive rather than sluggish.
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // In-page links, routed through Lenis so they ease rather than jump.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const href = anchor?.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -72, duration: 1.2 });
      // Keep the URL and the focus order honest for keyboard users.
      history.replaceState(null, '', href);
      (target as HTMLElement).setAttribute('tabindex', '-1');
      (target as HTMLElement).focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);

    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      // Deliberately not killing every ScrollTrigger here — each Reveal owns
      // and kills its own. Killing them all would strand still-mounted
      // sections at opacity 0 when this effect re-runs.
    };
  }, [reduced]);

  return <>{children}</>;
}
