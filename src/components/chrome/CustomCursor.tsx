'use client';

/**
 * A chalked cue tip for a cursor.
 *
 * A ring that follows with a little lag, and a dot that tracks exactly — the
 * gap between the two is what gives the pointer weight. Over anything that
 * declares `data-cursor-label`, the ring opens up and takes the word.
 *
 * Mounted only for a real pointer that can hover, and never for reduced
 * motion. `cursor: none` is applied by a data attribute on <html> that this
 * component owns, so if it fails to mount for any reason the native cursor is
 * still there — the page can never be left with no pointer at all.
 */

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useFinePointer, useReducedMotion } from '@/lib/hooks/useEnvironment';

export function CustomCursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.cursor = 'custom';
    return () => {
      delete document.documentElement.dataset.cursor;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const ringNode = ring.current;
    const dotNode = dot.current;
    if (!ringNode || !dotNode) return;

    const ringX = gsap.quickTo(ringNode, 'x', { duration: 0.42, ease: 'power3.out' });
    const ringY = gsap.quickTo(ringNode, 'y', { duration: 0.42, ease: 'power3.out' });
    const dotX = gsap.quickTo(dotNode, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dotNode, 'y', { duration: 0.08, ease: 'power2.out' });

    const onMove = (event: PointerEvent) => {
      setVisible(true);
      ringX(event.clientX);
      ringY(event.clientY);
      dotX(event.clientX);
      dotY(event.clientY);

      const target = event.target as HTMLElement | null;
      const labelled = target?.closest<HTMLElement>('[data-cursor-label]');
      const interactive = target?.closest('a, button, input, select, textarea, [role="button"]');
      setLabel(labelled?.dataset.cursorLabel ?? null);
      setActive(Boolean(labelled ?? interactive));
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf([ringNode, dotNode]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      <div
        ref={ring}
        className={`absolute top-0 left-0 flex items-center justify-center rounded-full border border-gold/70 transition-[width,height,background-color,border-color,opacity] duration-[var(--duration-hover)] ease-[var(--ease-out-quint)] ${
          visible ? 'opacity-100' : 'opacity-0'
        } ${label ? 'size-[68px] bg-gold text-ink' : active ? 'size-11 bg-gold/10' : 'size-8'}`}
        // GSAP writes `transform: translate(x, y)`; the CSS `translate`
        // property composes on top of it to centre the ring on that point.
        style={{ translate: '-50% -50%' }}
      >
        {label && (
          <span className="font-sans text-[0.5625rem] font-bold tracking-[0.16em] uppercase">
            {label}
          </span>
        )}
      </div>
      <div
        ref={dot}
        className={`absolute top-0 left-0 size-1 rounded-full bg-gold transition-opacity duration-200 ${
          visible && !label ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ translate: '-50% -50%' }}
      />
    </div>
  );
}
