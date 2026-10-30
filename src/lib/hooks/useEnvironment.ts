'use client';

/**
 * What the device can actually do.
 *
 * These read browser state that does not exist during server rendering, so
 * each one is wired through `useSyncExternalStore` rather than
 * state-set-inside-an-effect: React gets an explicit server snapshot, the
 * client value is correct on the very first client render instead of on a
 * second pass, and there are no cascading renders on mount.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}

/** Honoured by every GSAP timeline and the 3D opening sequence. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** Portrait reframes the table rather than squeezing it. */
export function usePortrait(): boolean {
  return useMediaQuery('(orientation: portrait) and (max-width: 48rem)');
}

/** A real pointer, which is the only thing that gets the custom cursor. */
export function useFinePointer(): boolean {
  return useMediaQuery('(pointer: fine) and (hover: hover)');
}

export type DeviceTier = 'high' | 'low' | 'none';

let cachedTier: DeviceTier | null = null;

/**
 * Decided once per page load, then cached.
 *
 * It is deliberately not re-evaluated on resize: changing tier would tear down
 * and rebuild the WebGL context mid-session, which is far more disruptive than
 * rendering a slightly conservative scene on a window somebody widened.
 *
 * `none` means no WebGL and the static fallback is shown. `low` drops shadows,
 * antialiasing and post-processing — chosen for small screens, few cores or
 * save-data, not because those devices cannot cope, but because a phone running
 * a shadow-mapped spotlight gets hot, and a hot phone throttles.
 */
function readTier(): DeviceTier {
  if (cachedTier) return cachedTier;

  let supported = false;
  try {
    const probe = document.createElement('canvas');
    supported = Boolean(
      probe.getContext('webgl2') ??
        probe.getContext('webgl') ??
        probe.getContext('experimental-webgl'),
    );
  } catch {
    supported = false;
  }

  if (!supported) {
    cachedTier = 'none';
    return cachedTier;
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.matchMedia('(max-width: 64rem)').matches;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  cachedTier = cores <= 4 || (coarse && small) || saveData ? 'low' : 'high';
  return cachedTier;
}

/** Nothing to subscribe to — the tier is fixed for the life of the page. */
const neverChanges = () => () => {};

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(neverChanges, readTier, () => 'high' as const);
}

/**
 * Reads a value that only exists in the browser, once, without a mount-time
 * state update. `read` must return a primitive and must not change between
 * calls within a session — the year, today's date, whether storage says this
 * is a repeat visit.
 */
export function useClientValue<T extends string | number | boolean | null>(
  read: () => T,
  serverValue: T,
): T {
  return useSyncExternalStore(neverChanges, read, () => serverValue);
}

/** False while rendering on the server, true in the browser. */
export function useIsClient(): boolean {
  return useClientValue(() => true, false);
}

/**
 * True while `element` is on screen and the tab is in front.
 *
 * The scene stops rendering entirely when this goes false, which is what keeps
 * a WebGL hero from burning battery for the whole of a long page. State is
 * written from observer callbacks, never synchronously on mount.
 */
export function useIsActive(element: React.RefObject<HTMLElement | null>): boolean {
  const [active, setActive] = useState(true);
  const onScreen = useRef(true);
  const tabVisible = useRef(true);

  useEffect(() => {
    const node = element.current;
    if (!node) return;

    const sync = () => setActive(onScreen.current && tabVisible.current);

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
        sync();
      },
      { rootMargin: '150px' },
    );
    observer.observe(node);

    const onVisibility = () => {
      tabVisible.current = !document.hidden;
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [element]);

  return active;
}
