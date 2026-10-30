import { Quote } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Photo } from '@/components/ui/Photo';
import { Prop3D } from '@/components/three/Prop3D';
import { FloatingCue, PropLights, SpinningBall } from '@/components/three/props';
import { BallGraphic } from '@/components/ui/BallGraphic';
import { site } from '@/lib/site';

/**
 * The room, in words and pictures.
 *
 * The photographs are placeholders until the library has real ones — see
 * `Photo`. What is real here are the reviews: three verbatim lines from the
 * 108 on Google, which say more about the place than any copy written for it.
 */
export function Experience() {
  return (
    <Section id="experience" tone="forest">
      <div className="gutter">
        <SectionHeading
          eyebrow="The Experience"
          title={
            <>
              Good shots.
              <br />
              <span className="text-gold">Great nights.</span>
            </>
          }
          lede="Three tables in one small room. Come for a serious frame, or just to mess about with friends and eat something."
        />

        {/* Editorial block: a tall frame, a short column, a wide frame below. */}
        <div className="mt-16 grid gap-5 md:mt-24 md:grid-cols-12 md:gap-6">
          <Reveal className="md:col-span-7">
            <Photo
              name="room-wide"
              alt="A full house around the snooker table, under the red pendant lamps"
              className="aspect-[4/3] w-full"
              sizes="(min-width: 768px) 58vw, 100vw"
            />
          </Reveal>

          <div className="flex flex-col justify-between gap-5 md:col-span-5">
            {/* The one interactive 3D prop outside the hero. It sits where a
                second photograph will eventually go. */}
            <Reveal delay={0.1}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-gold/15 bg-forest-raised">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(18,107,69,0.28),transparent_72%)]"
                />
                <Prop3D
                  className="absolute inset-0"
                  interactive
                  fallback={
                    <BallGraphic
                      number={8}
                      className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2"
                    />
                  }
                >
                  <PropLights />
                  <group position={[-0.2, 0.05, 0]}>
                    <SpinningBall number={8} radius={0.56} spinnable />
                  </group>
                  <group position={[0.85, -0.42, -0.6]} scale={0.7}>
                    <FloatingCue />
                  </group>
                </Prop3D>
                <p className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-center font-sans text-[0.5625rem] tracking-[0.22em] text-ash/55 uppercase">
                  Drag to spin · click to strike
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="rounded-sm border border-gold/15 bg-ink/45 p-7">
                <p className="font-display text-[1.375rem] leading-tight text-bone">
                  Two pool tables, one snooker table, and somewhere to sit.
                </p>
                <p className="measure mt-4 font-sans text-[0.9375rem] leading-relaxed text-ash">
                  {site.blurb} It is not a big place, which is rather the point — walk in
                  for a frame and you will know everyone at the other table by the end of
                  the night.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* What people actually said. */}
        <div className="mt-16 md:mt-24">
          <Reveal>
            <p className="eyebrow">
              {site.rating.score} out of 5 · {site.rating.count} {site.rating.source} reviews
            </p>
          </Reveal>

          <Reveal stagger={0.1} className="mt-8 grid gap-5 md:grid-cols-3 md:gap-6">
            {site.reviews.map((review) => (
              <figure
                key={review.quote}
                className="flex h-full flex-col gap-5 rounded-sm border border-bone/10 bg-ink/40 p-7 transition-colors duration-[var(--duration-hover)] hover:border-gold/35"
              >
                <Quote className="size-5 shrink-0 text-gold/60" aria-hidden="true" />
                <blockquote className="font-display text-[1.0625rem] leading-snug text-bone">
                  {review.quote}
                </blockquote>
                <figcaption className="mt-auto font-sans text-[0.625rem] tracking-[0.2em] text-ash/60 uppercase">
                  {review.source}
                </figcaption>
              </figure>
            ))}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
