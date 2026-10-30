'use client';

/**
 * The current year, for the copyright line.
 *
 * `new Date()` during render is a prerender error under Next 16's
 * `cacheComponents` — the value is not stable, so it cannot be baked into a
 * cached shell. Reading it through an external-store subscription keeps it off
 * the server render without a mount-time state update, and the year does not
 * change while somebody is looking at the page.
 */

import { useClientValue } from '@/lib/hooks/useEnvironment';

export function Year() {
  const year = useClientValue(() => new Date().getFullYear(), 0);
  return <>{year || null}</>;
}
