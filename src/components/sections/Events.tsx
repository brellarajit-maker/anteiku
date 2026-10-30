import { CalendarDays } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Photo } from '@/components/ui/Photo';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { Prop3D } from '@/components/three/Prop3D';
import { BrassRing, PropLights } from '@/components/three/props';
import { site, whatsappLink } from '@/lib/site';

/**
 * Tournaments, competitions and private bookings.
 *
 * `site.events` is empty, and inventing a fixture list for a real business is
 * the kind of thing that gets somebody turning up on a Tuesday for a
 * tournament that does not exist. So the empty state is the honest one, and it
 * still does a job: it says what the room can host and gives a way to ask.
 */
export function Events() {
  const hasEvents = site.events.length > 0;

  return (
    <Section id="events">
      <div className="gutter">
        <SectionHeading
          eyebrow="Events & Private Hire"
          title="Bring your game."
          lede="Birthdays, group nights, or the whole room to yourselves for an evening — being small has its uses."
        />

        {hasEvents ? (
          <Reveal stagger={0.08} className="mt-14 grid gap-5 md:mt-20 md:grid-cols-3 md:gap-6">
            {site.events.map((event) => (
              <article
                key={event.title}
                className="group overflow-hidden rounded-sm border border-bone/10 bg-forest transition-colors duration-[var(--duration-hover)] hover:border-gold/35"
              >
                <Photo
                  name={event.image ?? 'event'}
                  alt={event.title}
                  className="aspect-[4/3] w-full"
                  sizes="(min-width: 768px) 32vw, 100vw"
                />
                <div className="p-7">
                  <p className="eyebrow">{event.date}</p>
                  <h3 className="mt-3 text-[1.375rem]">{event.title}</h3>
                  <p className="mt-3 font-sans text-[0.9375rem] leading-relaxed text-ash">
                    {event.blurb}
                  </p>
                </div>
              </article>
            ))}
          </Reveal>
        ) : (
          <Reveal className="mt-14 md:mt-20">
            <div className="relative flex flex-col items-start gap-7 overflow-hidden rounded-sm border border-dashed border-gold/22 bg-forest-raised px-8 py-14 sm:px-12 sm:py-16">
              {/* A brass ring turning in the space the calendar would fill. */}
              <Prop3D className="absolute top-6 right-6 size-28 sm:size-36">
                <PropLights intensity={0.9} />
                <BrassRing />
              </Prop3D>

              <CalendarDays className="size-6 text-gold/70" aria-hidden="true" />
              <div>
                <p className="font-display text-[clamp(1.5rem,3.6vw,2.25rem)] font-bold text-bone">
                  New events coming soon.
                </p>
                <p className="measure mt-4 font-sans text-[0.9375rem] leading-relaxed text-ash">
                  Nothing is on the calendar at the moment. If you want the room for a
                  birthday or a group night, ask — with three tables it does not take many
                  of you to have the place to yourselves.
                </p>
              </div>

              <MagneticButton
                href={whatsappLink(
                  `Hi ${site.name} — I'd like to ask about booking the room for an event.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                cursorLabel="Ask"
              >
                Ask about private hire
              </MagneticButton>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
