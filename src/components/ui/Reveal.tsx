'use client';

/**
 * The site's one scroll reveal.
 *
 * Short, small, and always the same: eighteen pixels and a fade. Having a
 * single reveal — rather than one per section, each with its own direction and
 * distance — is what keeps a long dark page feeling composed instead of busy.
 *
 * It is also fail-safe. The content is rendered visible and GSAP hides it on
 * mount, so if JavaScript never runs, or ScrollTrigger fails, every section is
 * simply there.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/lib/hooks/useEnvironment';

export function Reveal({
  children,
  delay = 0,
  /** Stagger the element's own children instead of moving it as one block. */
  stagger,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const node = host.current;
    if (!node) return;

    gsap.registerPlugin(ScrollTrigger);
    const targets = stagger ? Array.from(node.children) : node;

    const tween = gsap.fromTo(
      targets,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay,
        stagger: stagger ?? 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: node,
          // Fires a little before the element reaches the fold, so the motion
          // has finished by the time it is properly in view.
          start: 'top 88%',
          once: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(targets, { clearProps: 'opacity,transform' });
    };
  }, [delay, stagger, reduced]);

  return (
    <div ref={host} className={className}>
      {children}
    </div>
  );
}
