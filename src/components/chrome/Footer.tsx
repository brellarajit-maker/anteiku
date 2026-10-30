import { MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { Year } from '@/components/ui/Year';
import { site, telLink, whatsappLink } from '@/lib/site';

/**
 * Drawn here because lucide dropped its brand icons in v1, and the nearest
 * generic glyph (`AtSign`) would misdescribe where the link goes.
 */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Visit, and the sign-off.
 *
 * Hours are the interesting case. Google shows "Add full hours" for Anteiku,
 * so the real schedule is not public — this prints one honest line instead of
 * a fabricated weekly table, and switches to the full table by itself the
 * moment `site.hours.weekly` has entries.
 */
export function Footer() {
  const { address, contact, social, hours } = site;

  return (
    <footer id="visit" className="rule-gold scroll-mt-24 bg-ink">
      <div className="gutter py-24 md:py-32">
        <Reveal>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-[clamp(2.5rem,8vw,6rem)]">
              One more
              <br />
              <span className="text-gold">game?</span>
            </h2>

            <div className="flex flex-wrap items-center gap-3.5">
              <MagneticButton href="#book" cursorLabel="Book">
                Book a table
              </MagneticButton>
              <MagneticButton href={telLink()} variant="ghost" cursorLabel="Call">
                <Phone className="size-4" aria-hidden="true" />
                {contact.phone}
              </MagneticButton>
            </div>
          </div>
        </Reveal>

        <div className="rule-gold mt-16 grid gap-10 pt-12 md:mt-20 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <Reveal>
            <div>
              <h3 className="eyebrow">Find us</h3>
              <address className="mt-5 font-sans text-[0.9375rem] leading-relaxed text-ash not-italic">
                {address.line1}
                <br />
                {address.line2}
                <br />
                {address.city}, {address.region} {address.pin}
              </address>
              <a
                href={address.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-sans text-[0.8125rem] text-gold transition-opacity hover:opacity-75"
                data-cursor-label="Map"
              >
                <MapPin className="size-4" aria-hidden="true" />
                Open in Google Maps
              </a>
              <p className="mt-4 font-sans text-[0.6875rem] tracking-[0.14em] text-ash/45 uppercase">
                DIGIPIN {address.digipin}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div>
              <h3 className="eyebrow">Hours</h3>
              {hours.weekly.length > 0 ? (
                <dl className="mt-5 space-y-2.5">
                  {hours.weekly.map((row) => (
                    <div key={row.days} className="flex justify-between gap-4">
                      <dt className="font-sans text-[0.9375rem] text-ash">{row.days}</dt>
                      <dd className="font-sans text-[0.9375rem] text-bone">
                        {row.open} – {row.close}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-5 font-sans text-[0.9375rem] leading-relaxed text-ash">
                  {hours.note}
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div>
              <h3 className="eyebrow">Talk to us</h3>
              <ul className="mt-5 space-y-3.5">
                <li>
                  <a
                    href={telLink()}
                    className="inline-flex items-center gap-2.5 font-sans text-[0.9375rem] text-ash transition-colors hover:text-bone"
                  >
                    <Phone className="size-4 shrink-0 text-gold/70" aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappLink(`Hi ${site.name} — I'd like to ask about a table.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 font-sans text-[0.9375rem] text-ash transition-colors hover:text-bone"
                  >
                    <MessageCircle className="size-4 shrink-0 text-gold/70" aria-hidden="true" />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 font-sans text-[0.9375rem] text-ash transition-colors hover:text-bone"
                  >
                    <InstagramGlyph className="size-4 shrink-0 text-gold/70" />
                    {social.igHandle}
                  </a>
                </li>
                {contact.email && (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-sans text-[0.9375rem] text-ash transition-colors hover:text-bone"
                    >
                      {contact.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="flex flex-col items-start gap-5">
              <img
                src="./brand/emblem-512.webp"
                alt={`${site.fullName} emblem`}
                width={512}
                height={512}
                loading="lazy"
                decoding="async"
                className="w-36 transition-transform duration-[var(--duration-scene)] ease-[var(--ease-out-quint)] hover:scale-[1.04]"
              />
              <p className="inline-flex items-center gap-2 font-sans text-[0.8125rem] text-ash">
                <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
                {site.rating.score} on {site.rating.source}
                <span className="text-ash/55">({site.rating.count} reviews)</span>
              </p>
            </div>
          </Reveal>
        </div>

        <div className="rule-gold mt-16 flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[0.75rem] text-ash/55">
            © <Year /> {site.fullName}. {site.address.city}.
          </p>
          <p className="font-sans text-[0.6875rem] tracking-[0.18em] text-ash/40 uppercase">
            Every shot has a story
          </p>
        </div>
      </div>
    </footer>
  );
}
