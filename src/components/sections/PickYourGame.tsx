'use client';

/**
 * Two games, two cards, two different ideas.
 *
 * The brief warned against repeating one hover effect across both, so they do
 * not share one. Pool leans into the lamp: the card lights up and the 8-ball
 * turns under it. Snooker leans into the cloth: it is darker, wine-tinted, and
 * the three balls part to let the cue ball through. Both tilt toward the
 * cursor, and neither does anything at all on a touch device beyond being a
 * perfectly good card.
 */

import { ArrowUpRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { BallGraphic } from '@/components/ui/BallGraphic';
import { Prop3D } from '@/components/three/Prop3D';
import { BallTrio, PropLights, SpinningBall } from '@/components/three/props';
import { useFinePointer, useReducedMotion } from '@/lib/hooks/useEnvironment';

/**
 * Tilt toward the cursor.
 *
 * The element comes from `event.currentTarget` rather than a ref — it is by
 * definition the element the handler is attached to, so there is nothing to
 * store, nothing to go stale, and the same hook works on any number of cards.
 */
function useTilt(max = 6) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const live = fine && !reduced;

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!live) return;
    const node = event.currentTarget;
    const box = node.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    node.style.setProperty('--tilt-x', `${-py * max}deg`);
    node.style.setProperty('--tilt-y', `${px * max}deg`);
    node.style.setProperty('--sheen-x', `${(px + 0.5) * 100}%`);
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    const node = event.currentTarget;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
  };

  return { onPointerMove, onPointerLeave };
}

export function PickYourGame() {
  const pool = useTilt();
  const snooker = useTilt(5);

  return (
    <Section id="games" watermark>
      <div className="gutter">
        <SectionHeading eyebrow="Our Games" title="Pick your game." />

        <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-2 md:gap-6">
          {/* 8-ball: lit, warm, gold. */}
          <Reveal>
            <article
              onPointerMove={pool.onPointerMove}
              onPointerLeave={pool.onPointerLeave}
              className="group relative isolate h-full overflow-hidden rounded-sm border border-bone/10 bg-forest p-8 transition-[transform,border-color,box-shadow] duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] will-change-transform hover:border-gold/45 hover:shadow-[0_24px_70px_-30px_rgba(214,180,106,0.45)] sm:p-10"
              style={{
                transform:
                  'perspective(1100px) rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))',
              }}
            >
              {/* Felt, and the lamp coming up on hover. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_var(--sheen-x,50%)_0%,rgba(26,143,91,0.38),transparent_70%)] opacity-70 transition-opacity duration-[var(--duration-panel)] group-hover:opacity-100"
              />

              <div className="flex items-start justify-between gap-6">
                <Prop3D
                  className="size-20 shrink-0 sm:size-24"
                  fallback={<BallGraphic number={8} className="size-20 shrink-0 sm:size-24" />}
                >
                  <PropLights />
                  <SpinningBall number={8} radius={0.74} speed={0.45} />
                </Prop3D>
                <ArrowUpRight
                  className="size-5 shrink-0 text-ash transition-colors duration-[var(--duration-hover)] group-hover:text-gold"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-10 text-[clamp(1.75rem,3.4vw,2.5rem)]">8-Ball Pool</h3>
              <p className="measure mt-4 font-sans text-[0.9375rem] leading-relaxed text-ash">
                Call your shot. Control the table.
              </p>

              <a
                href="#pricing"
                className="mt-8 inline-flex items-center gap-2 font-sans text-[0.6875rem] font-semibold tracking-[0.16em] text-gold uppercase"
                data-cursor-label="Book"
              >
                Explore pool
                <span
                  aria-hidden="true"
                  className="h-px w-8 origin-left bg-gold transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out-quint)] group-hover:scale-x-150"
                />
                <span className="sr-only">— see pool rates and book</span>
              </a>
            </article>
          </Reveal>

          {/* Snooker: darker, wine, the balls part. */}
          <Reveal delay={0.1}>
            <article
              onPointerMove={snooker.onPointerMove}
              onPointerLeave={snooker.onPointerLeave}
              className="group relative isolate h-full overflow-hidden rounded-sm border border-bone/10 bg-ink-raised p-8 transition-[transform,border-color,box-shadow] duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] will-change-transform hover:border-wine-lit/55 hover:shadow-[0_24px_70px_-30px_rgba(160,58,66,0.45)] sm:p-10"
              style={{
                transform:
                  'perspective(1100px) rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))',
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(85%_75%_at_50%_100%,rgba(118,44,50,0.4),transparent_68%)] opacity-70 transition-opacity duration-[var(--duration-panel)] group-hover:opacity-100"
              />

              <div className="flex items-start justify-between gap-6">
                <Prop3D
                  className="h-20 w-36 shrink-0 sm:h-24 sm:w-44"
                  fallback={
                    <div className="flex shrink-0 items-end">
                      <BallGraphic number={3} className="size-14 sm:size-16" />
                      <BallGraphic number={0} className="-ml-4 size-16 sm:size-20" />
                      <BallGraphic number={8} className="-ml-4 size-14 sm:size-16" />
                    </div>
                  }
                >
                  <PropLights />
                  <BallTrio />
                </Prop3D>
                <ArrowUpRight
                  className="size-5 shrink-0 text-ash transition-colors duration-[var(--duration-hover)] group-hover:text-wine-lit"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-10 text-[clamp(1.75rem,3.4vw,2.5rem)]">Snooker</h3>
              <p className="measure mt-4 font-sans text-[0.9375rem] leading-relaxed text-ash">
                Patience, precision, and the perfect break.
              </p>

              <a
                href="#pricing"
                className="mt-8 inline-flex items-center gap-2 font-sans text-[0.6875rem] font-semibold tracking-[0.16em] text-bone uppercase"
                data-cursor-label="Book"
              >
                Explore snooker
                <span
                  aria-hidden="true"
                  className="h-px w-8 origin-left bg-wine-lit transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out-quint)] group-hover:scale-x-150"
                />
                <span className="sr-only">— see snooker rates and book</span>
              </a>
            </article>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
