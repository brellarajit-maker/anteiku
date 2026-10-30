'use client';

/**
 * The availability board.
 *
 * It shows the real floor — every pool and snooker table — and what each one
 * is doing. Until a booking source is connected it says so, in those words,
 * and offers the phone instead. There is a demo toggle for reviewing the
 * design, and anything it shows is banner-labelled as demo while it is on.
 *
 * Wiring it up later is one prop: pass an `AvailabilitySource` that reads your
 * booking system. The layout, the polling and the states are already here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Phone, RefreshCw } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { site, telLink } from '@/lib/site';
import {
  STATUS_COPY,
  demo,
  unconnected,
  type AvailabilitySource,
  type TableStatus,
} from '@/lib/availability';

/** How often a connected source is re-read. */
const POLL_MS = 60_000;

export function Availability({ source = unconnected }: { source?: AvailabilitySource }) {
  const [preview, setPreview] = useState(false);
  const active = preview ? demo : source;

  const [rows, setRows] = useState<TableStatus[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  /**
   * `spinner` is off for the first read because `loading` already starts true
   * — turning it on synchronously would mean setting state during the mount
   * effect and rendering twice for nothing.
   */
  const load = useCallback(async (spinner = false) => {
    if (spinner) setLoading(true);
    try {
      const next = await active.read();
      if (!mounted.current) return;
      setRows(next);
      setUpdatedAt(new Date());
      setFailed(false);
    } catch {
      if (!mounted.current) return;
      // A source that throws must not leave stale numbers on screen.
      setRows(site.tables.map((t) => ({ id: t.id, status: 'unknown' as const })));
      setFailed(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    mounted.current = true;
    void load();
    if (active.kind === 'unconnected') return () => void (mounted.current = false);

    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [load, active.kind]);

  const byId = new Map(rows.map((r) => [r.id, r]));
  const connected = active.kind === 'live' && !failed;

  return (
    <Section id="tables" tone="forest" watermark>
      <div className="gutter">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Tables"
            title={
              <>
                What&apos;s free
                <br />
                <span className="text-gold">right now.</span>
              </>
            }
            lede="All three tables at a glance, so you know whether to walk in or call ahead."
            className="lg:max-w-[34rem]"
          />

          <Reveal delay={0.1} className="shrink-0">
            <div className="flex flex-wrap items-center gap-5">
              {(['free', 'occupied', 'reserved'] as const).map((status) => (
                <span key={status} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full ${STATUS_COPY[status].dot}`}
                  />
                  <span className="font-sans text-[0.6875rem] tracking-[0.14em] text-ash uppercase">
                    {STATUS_COPY[status].label}
                  </span>
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Where the numbers come from. Always visible, never ambiguous. */}
        <Reveal delay={0.14}>
          <div
            className={`mt-12 flex flex-wrap items-center justify-between gap-4 rounded-sm border px-5 py-4 ${
              connected
                ? 'border-baize-lit/35 bg-baize-deep/25'
                : preview
                  ? 'border-gold/35 bg-gold/[0.07]'
                  : 'border-bone/12 bg-ink/40'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="flex items-center gap-2.5 font-sans text-[0.8125rem] text-bone/85">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${
                  connected ? 'bg-baize-lit' : preview ? 'bg-gold' : 'bg-ash/50'
                }`}
              />
              {failed ? 'Could not reach the booking system' : active.label}
              {connected && updatedAt && (
                <span className="text-ash/65">
                  · updated{' '}
                  {updatedAt.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </p>

            <div className="flex items-center gap-4">
              {connected && (
                <button
                  type="button"
                  onClick={() => void load(true)}
                  className="inline-flex items-center gap-2 font-sans text-[0.6875rem] tracking-[0.14em] text-ash uppercase transition-colors hover:text-gold"
                >
                  <RefreshCw
                    className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
              )}

              {/* Only offered while there is nothing real to show. */}
              {source.kind === 'unconnected' && (
                <label className="flex cursor-pointer items-center gap-2.5 font-sans text-[0.6875rem] tracking-[0.14em] text-ash uppercase">
                  <input
                    type="checkbox"
                    checked={preview}
                    onChange={(e) => setPreview(e.target.checked)}
                    className="size-4 accent-[var(--color-gold)]"
                  />
                  Preview with demo data
                </label>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal stagger={0.06} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {site.tables.map((table) => {
            const row = byId.get(table.id);
            const status = row?.status ?? 'unknown';
            const copy = STATUS_COPY[status];

            return (
              <div
                key={table.id}
                className="flex items-center justify-between gap-4 rounded-sm border border-bone/10 bg-ink/45 px-5 py-5 transition-colors duration-[var(--duration-hover)] hover:border-gold/30"
              >
                <div className="min-w-0">
                  <p className="font-display text-[1.0625rem] font-semibold text-bone">
                    {table.label}
                  </p>
                  <p className="mt-1 font-sans text-[0.6875rem] tracking-[0.16em] text-ash/65 uppercase">
                    {[table.size, table.game === 'pool' ? '8-ball' : 'Snooker']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="text-right">
                    <span
                      className={`block font-sans text-[0.75rem] font-semibold tracking-[0.1em] uppercase ${copy.text}`}
                    >
                      {copy.label}
                    </span>
                    {row?.freeAt && (
                      <span className="block font-sans text-[0.6875rem] text-ash/60">
                        free in {row.freeAt}
                      </span>
                    )}
                    {row?.note && !row.freeAt && (
                      <span className="block font-sans text-[0.6875rem] text-ash/60">
                        {row.note}
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true" className={`size-2.5 rounded-full ${copy.dot}`} />
                </div>
              </div>
            );
          })}
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href={telLink()} variant="ghost" cursorLabel="Call">
              <Phone className="size-4" aria-hidden="true" />
              Call {site.contact.phone}
            </MagneticButton>
            <p className="font-sans text-[0.8125rem] text-ash/70">
              {connected
                ? 'Tables can change between refreshes — a call still confirms it.'
                : 'Ring ahead and we will tell you what is open.'}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
