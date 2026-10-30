/**
 * Live table availability.
 *
 * This is the one part of the site that must never invent anything. A board
 * that says "Pool 2 — free" when nobody checked is worse than no board: someone
 * drives to Lado Sarai on the strength of it.
 *
 * So the data comes from an adapter. Until a real booking source is connected
 * the adapter reports `unknown` for every table and the board says so plainly,
 * with a call button. A `demo` adapter exists so the design can be reviewed,
 * and anything it produces is labelled as demo on screen.
 *
 * To go live, write an adapter that returns `TableStatus[]` from your booking
 * system and pass it to `<Availability source={…} />`. Nothing else changes.
 */

import { site } from './site';

export type Status = 'free' | 'occupied' | 'reserved' | 'unknown';

export interface TableStatus {
  id: string;
  status: Status;
  /** When the current session is expected to end. Only for `occupied`. */
  freeAt?: string;
  /** Who it is held for, if the source chooses to expose that. */
  note?: string;
}

export interface AvailabilitySource {
  /** Shown on the board so nobody mistakes demo data for the real thing. */
  kind: 'live' | 'demo' | 'unconnected';
  label: string;
  read(): Promise<TableStatus[]>;
}

/**
 * The default. Every table reports `unknown`, which the board renders as
 * "not connected" rather than as an availability claim.
 */
export const unconnected: AvailabilitySource = {
  kind: 'unconnected',
  label: 'Live status not connected',
  async read() {
    return site.tables.map((t) => ({ id: t.id, status: 'unknown' as const }));
  },
};

/**
 * Plausible occupancy for reviewing the design. Deterministic per half hour so
 * it does not flicker while you look at it, and never presented as real.
 */
export const demo: AvailabilitySource = {
  kind: 'demo',
  label: 'Demo data — not real availability',
  async read() {
    const bucket = Math.floor(Date.now() / (30 * 60 * 1000));
    return site.tables.map((table, i) => {
      const roll = (bucket * 31 + i * 17) % 10;
      if (roll < 4) return { id: table.id, status: 'free' as const };
      if (roll < 8) {
        const minutes = 15 + ((roll * 13) % 45);
        return {
          id: table.id,
          status: 'occupied' as const,
          freeAt: `~${minutes} min`,
        };
      }
      return { id: table.id, status: 'reserved' as const, note: 'Held' };
    });
  },
};

export const STATUS_COPY: Record<Status, { label: string; dot: string; text: string }> = {
  free: { label: 'Free', dot: 'bg-baize-lit', text: 'text-baize-lit' },
  occupied: { label: 'In play', dot: 'bg-gold', text: 'text-gold' },
  reserved: { label: 'Reserved', dot: 'bg-wine-lit', text: 'text-wine-lit' },
  unknown: { label: 'Ask us', dot: 'bg-ash/45', text: 'text-ash' },
};
