'use client';

/**
 * The entrance.
 *
 * The brief asked for a full cinematic loader — an 8-ball rolling at the
 * camera before the homepage appears. The hero's break already *is* that
 * sequence, and two cinematic openings back to back is one too many, so this
 * does the job a loader is actually for: it covers the wait, sets the room's
 * tone, and gets out of the way the moment the table is ready to break.
 *
 * It is skippable with any key or click, it never holds the page longer than
 * `MAX_WAIT`, it shortens to a brief fade on repeat visits in the same session,
 * and it does not appear at all for reduced motion.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useClientValue, useIsClient, useReducedMotion } from '@/lib/hooks/useEnvironment';

/** True once the hero may start its break. */
const IntroContext = createContext(true);
export const useIntroDone = () => useContext(IntroContext);

/** Never hold the page longer than this, whatever is still loading. */
const MAX_WAIT = 3200;
/** Short of this the curtain just flashes, which looks like a bug. */
const MIN_SHOW = 900;
const SEEN_KEY = 'anteiku:seen';

/**
 * Whether this session has already seen the entrance, read once and cached.
 *
 * The cache is not an optimisation: this doubles as the write that marks the
 * visit, and it is read during render, so it has to give the same answer every
 * time it is called or React would spin.
 */
let seenCache: boolean | null = null;

function readSeen(): boolean {
  if (seenCache !== null) return seenCache;
  try {
    seenCache = sessionStorage.getItem(SEEN_KEY) === '1';
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Private mode or blocked storage — treat it as a first visit.
    seenCache = false;
  }
  return seenCache;
}

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [lifted, setLifted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Derived, not stored: reduced motion means there was never a curtain to
  // lift, so the page is "past the entrance" from the first render.
  const done = lifted || reduced;

  // Both read on the client only, so the server never renders a curtain it
  // cannot know is needed and a repeat visitor is not shown the full thing.
  const mounted = useIsClient();
  const returning = useClientValue(readSeen, false);

  const curtain = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;

    const node = curtain.current;
    if (!node || reduced) {
      setLifted(true);
      return;
    }

    gsap
      .timeline({ onComplete: () => setLifted(true) })
      .to(inner.current, { opacity: 0, y: -18, duration: 0.42, ease: 'power2.in' })
      .to(node, { yPercent: -100, duration: 0.86, ease: 'power3.inOut' }, '-=0.1');
  }, [reduced]);

  useEffect(() => {
    // Nothing to run on the server, and nothing to run for reduced motion —
    // `done` is already true in that case.
    if (!mounted || reduced) return;

    const started = performance.now();
    const hold = returning ? 260 : MIN_SHOW;

    // Progress is honest about two real things — the fonts and the emblem —
    // and eases the rest, rather than animating a meaningless bar.
    const signals = [
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = img.onerror = () => resolve();
        // Relative, so the export also works opened straight off the disk.
        img.src = './brand/emblem-1024.webp';
      }),
    ];

    let settled = 0;
    signals.forEach((signal) => {
      void signal.then(() => {
        settled += 1;
        setProgress(settled / signals.length);
      });
    });

    const release = () => {
      const elapsed = performance.now() - started;
      window.setTimeout(finish, Math.max(0, hold - elapsed));
    };

    void Promise.all(signals).then(release);
    const cap = window.setTimeout(finish, MAX_WAIT);

    const skip = () => finish();
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);

    return () => {
      window.clearTimeout(cap);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [mounted, reduced, returning, finish]);

  return (
    <IntroContext.Provider value={done}>
      {children}

      {mounted && !done && !reduced && (
        <div
          ref={curtain}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-ink"
          role="status"
          aria-live="polite"
        >
          <div ref={inner} className="flex flex-col items-center gap-9 px-6">
            <img
              src="./brand/emblem-1024.webp"
              alt=""
              width={1024}
              height={1024}
              fetchPriority="high"
              decoding="async"
              className={`w-[min(62vw,19rem)] ${returning ? '' : 'animate-[intro-rise_1.2s_var(--ease-out-quint)_both]'}`}
            />

            <div className="flex flex-col items-center gap-4">
              <p className="font-sans text-[0.625rem] tracking-[0.36em] text-ash/70 uppercase">
                Every shot has a story
              </p>
              <div className="h-px w-40 overflow-hidden bg-bone/12">
                <span
                  className="block h-full bg-gold transition-[width] duration-500 ease-[var(--ease-out-quint)]"
                  style={{ width: `${Math.max(12, progress * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <span className="sr-only">Loading Anteiku Pool and Snooker</span>
        </div>
      )}
    </IntroContext.Provider>
  );
}
