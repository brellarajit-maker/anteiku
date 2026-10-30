'use client';

/**
 * The gallery.
 *
 * An asymmetric grid rather than a tidy one — the frames are deliberately
 * different sizes so the eye moves through it. Clicking a photograph opens it
 * full screen; arrow keys move between, Escape closes, and focus returns to
 * the frame you came from.
 *
 * With no photographs in the library yet, the same grid renders as labelled
 * placeholders describing the shot each frame wants. The lightbox is only
 * wired up for real images.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Photo } from '@/components/ui/Photo';
import { photos } from '@/lib/photos.generated';

/**
 * The shot list. Each entry is the name the file must have in the asset
 * library, the brief for the photograph, and how much of the grid it takes.
 */
const FRAMES = [
  { name: 'room-night', alt: 'The room after dark, lamps down over the tables', span: 'md:col-span-7 md:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[32rem]' },
  { name: 'break-shot', alt: 'A break, mid-scatter', span: 'md:col-span-5 aspect-[4/3]' },
  { name: 'cafe-counter', alt: 'The cafe counter and the food coming out', span: 'md:col-span-5 aspect-[4/3]' },
  { name: 'cues-rack', alt: 'Cues on the wall rack, chalk and rests', span: 'md:col-span-4 aspect-square' },
  { name: 'friends-playing', alt: 'Friends around a table mid-frame, laughing', span: 'md:col-span-8 aspect-[16/10]' },
] as const;

export function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const available = FRAMES.filter((f) => photos.some((p) => p.name === f.name));

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);

  const step = useCallback(
    (by: number) => {
      setOpen((current) => {
        if (current === null) return current;
        return (current + by + available.length) % available.length;
      });
    },
    [available.length],
  );

  useEffect(() => {
    if (open === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close, step]);

  const current = open !== null ? available[open] : null;

  return (
    <Section id="gallery">
      <div className="gutter">
        <SectionHeading eyebrow="Gallery" title="The vibe speaks for itself." />

        <div className="mt-14 grid gap-4 md:mt-20 md:grid-cols-12 md:gap-5">
          {FRAMES.map((frame, index) => {
            const real = photos.some((p) => p.name === frame.name);
            const openIndex = available.findIndex((f) => f.name === frame.name);

            const inner = (
              <Photo
                name={frame.name}
                alt={frame.alt}
                className="size-full transition-transform duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] group-hover:scale-[1.03]"
                sizes="(min-width: 768px) 55vw, 100vw"
                priority={index === 0}
              />
            );

            return (
              <Reveal key={frame.name} delay={index * 0.06} className={frame.span}>
                {real ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      openerRef.current = event.currentTarget;
                      setOpen(openIndex);
                    }}
                    data-cursor-label="View"
                    className="group relative block size-full overflow-hidden rounded-sm"
                  >
                    {inner}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-ink/35 opacity-0 transition-opacity duration-[var(--duration-hover)] group-hover:opacity-100"
                    />
                    <span className="sr-only">Open: {frame.alt}</span>
                  </button>
                ) : (
                  <div className="group size-full overflow-hidden rounded-sm">{inner}</div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>

      {current && (
        <div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          tabIndex={-1}
          className="fixed inset-0 z-[80] flex flex-col bg-ink/97 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-5 py-5">
            <p className="font-sans text-[0.6875rem] tracking-[0.2em] text-ash uppercase">
              {open !== null ? open + 1 : 0} / {available.length}
            </p>
            <button
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors hover:border-gold hover:text-gold"
            >
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Close gallery</span>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center gap-3 px-5 pb-8">
            <button
              type="button"
              onClick={() => step(-1)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
              <span className="sr-only">Previous photograph</span>
            </button>

            <Photo
              name={current.name}
              alt={current.alt}
              className="h-full min-h-0 flex-1"
              sizes="90vw"
            />

            <button
              type="button"
              onClick={() => step(1)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
              <span className="sr-only">Next photograph</span>
            </button>
          </div>

          <p className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center font-sans text-sm text-ash">
            {current.alt}
          </p>
        </div>
      )}
    </Section>
  );
}
