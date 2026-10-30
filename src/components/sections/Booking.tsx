'use client';

/**
 * Rates, and the enquiry.
 *
 * Two things this deliberately does not do. It does not print an hourly rate,
 * because nobody has supplied one — `price: null` renders "Rates on request"
 * beside a phone number, and the moment a real number goes into `site.ts` the
 * same card prints it. And it does not confirm anything: there is no booking
 * backend, so the form hands a filled-in message to WhatsApp and says plainly
 * that the table is held only once Anteiku replies.
 *
 * That is a real, working enquiry route — not a demo — which is why it is not
 * labelled as one.
 */

import { useMemo, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { BallGraphic } from '@/components/ui/BallGraphic';
import { useClientValue } from '@/lib/hooks/useEnvironment';
import { site, telLink, whatsappLink } from '@/lib/site';

const DURATIONS = ['1 hour', '2 hours', '3 hours', 'Open ended'] as const;

/**
 * Today, in the visitor's own timezone, as the date input wants it.
 *
 * Read on the client only: a client component is still prerendered, and
 * `new Date()` there is baked into the cached shell — a build error under
 * Next 16, and it would otherwise mean a page served on Tuesday still
 * refusing Monday.
 */
function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

const fieldClass =
  'w-full rounded-sm border border-bone/15 bg-ink px-4 py-3 font-sans text-[0.9375rem] text-bone ' +
  'placeholder:text-ash/45 transition-colors duration-[var(--duration-hover)] ' +
  'hover:border-bone/30 focus:border-gold focus:outline-none';

const labelClass =
  'block font-sans text-[0.6875rem] font-medium tracking-[0.16em] text-ash uppercase';

export function Booking() {
  const [game, setGame] = useState<'pool' | 'snooker'>('pool');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [players, setPlayers] = useState(2);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>('2 hours');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const minDate = useClientValue(today, '');

  const gameName = game === 'pool' ? '8-Ball Pool' : 'Snooker';

  const message = useMemo(() => {
    const lines = [
      `Hi ${site.name} — I'd like to enquire about a ${gameName} table.`,
      '',
      date && `Date: ${date}`,
      time && `Time: ${time}`,
      `Players: ${players}`,
      `Duration: ${duration}`,
      name && `Name: ${name}`,
      phone && `Phone: ${phone}`,
    ].filter(Boolean);
    return lines.join('\n');
  }, [gameName, date, time, players, duration, name, phone]);

  return (
    <Section id="pricing" tone="forest">
      <div className="gutter">
        <SectionHeading
          eyebrow="Pricing & Booking"
          title="Your table is waiting."
          lede="Tell us when, and we will hold a table. Walk-ins are welcome too — the board above shows which tables are free."
        />

        <div className="mt-14 grid gap-5 md:mt-20 lg:grid-cols-12 lg:gap-6">
          {/* Rates. */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            {site.pricing.map((tier, index) => (
              <Reveal key={tier.id} delay={index * 0.08}>
                <article
                  className={`flex h-full items-start gap-5 rounded-sm border p-7 transition-colors duration-[var(--duration-hover)] ${
                    game === tier.id
                      ? 'border-gold/45 bg-ink/55'
                      : 'border-bone/10 bg-ink/35 hover:border-bone/25'
                  }`}
                >
                  <BallGraphic number={tier.id === 'pool' ? 8 : 3} className="size-12 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-[1.375rem]">{tier.name}</h3>
                    <p className="mt-2 font-sans text-[0.9375rem] text-ash">{tier.blurb}</p>

                    <p className="mt-5 font-display text-[1.75rem] leading-none text-gold">
                      {tier.price === null ? (
                        <span className="text-[1.125rem] text-bone">Rates on request</span>
                      ) : (
                        <>
                          ₹{tier.price}
                          <span className="ml-1.5 font-sans text-[0.8125rem] text-ash">
                            {tier.unit}
                          </span>
                        </>
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => setGame(tier.id)}
                      className="mt-5 font-sans text-[0.6875rem] font-semibold tracking-[0.16em] text-gold uppercase transition-opacity hover:opacity-75"
                    >
                      {game === tier.id ? 'Selected' : `Enquire about ${tier.name}`}
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}

            <Reveal delay={0.2}>
              <p className="font-sans text-[0.8125rem] leading-relaxed text-ash/70">
                Hourly rates are not published online yet. Ring{' '}
                <a href={telLink()} className="text-gold underline underline-offset-4">
                  {site.contact.phone}
                </a>{' '}
                and we will tell you exactly what a frame costs.
              </p>
            </Reveal>
          </div>

          {/* Enquiry. */}
          <Reveal delay={0.12} className="lg:col-span-7">
            <form
              id="book"
              className="scroll-mt-28 rounded-sm border border-bone/12 bg-ink/55 p-7 sm:p-9"
              onSubmit={(event) => {
                // The anchor below does the work; this only stops a page reload
                // if the form is submitted with the keyboard.
                event.preventDefault();
                window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
              }}
            >
              <h3 className="text-[1.5rem]">Enquire about a table</h3>

              <fieldset className="mt-7">
                <legend className={labelClass}>Game</legend>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {site.pricing.map((tier) => (
                    <label
                      key={tier.id}
                      className={`cursor-pointer rounded-sm border px-4 py-3 text-center font-sans text-[0.875rem] transition-colors duration-[var(--duration-hover)] has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:checked]:text-gold ${
                        'border-bone/15 text-ash hover:border-bone/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="game"
                        value={tier.id}
                        checked={game === tier.id}
                        onChange={() => setGame(tier.id)}
                        className="sr-only"
                      />
                      {tier.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="book-date">
                    Date
                  </label>
                  <input
                    id="book-date"
                    type="date"
                    min={minDate || undefined}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`mt-3 ${fieldClass}`}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="book-time">
                    Time
                  </label>
                  <input
                    id="book-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`mt-3 ${fieldClass}`}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="book-players">
                    Players
                  </label>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlayers((n) => Math.max(1, n - 1))}
                      className="size-11 shrink-0 rounded-sm border border-bone/15 text-bone transition-colors hover:border-gold hover:text-gold"
                      aria-label="One fewer player"
                    >
                      −
                    </button>
                    {/* `output` is a labelable element, so the label above
                        names the count. `htmlFor` here would mean something
                        else entirely — the inputs that fed the result. */}
                    <output
                      id="book-players"
                      className="flex-1 text-center font-display text-[1.25rem] text-bone"
                    >
                      {players}
                    </output>
                    <button
                      type="button"
                      onClick={() => setPlayers((n) => Math.min(12, n + 1))}
                      className="size-11 shrink-0 rounded-sm border border-bone/15 text-bone transition-colors hover:border-gold hover:text-gold"
                      aria-label="One more player"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="book-duration">
                    Duration
                  </label>
                  <select
                    id="book-duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as (typeof DURATIONS)[number])}
                    className={`mt-3 ${fieldClass}`}
                  >
                    {DURATIONS.map((option) => (
                      <option key={option} value={option} className="bg-ink">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="book-name">
                    Your name
                  </label>
                  <input
                    id="book-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`mt-3 ${fieldClass}`}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="book-phone">
                    Your number
                  </label>
                  <input
                    id="book-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`mt-3 ${fieldClass}`}
                  />
                </div>
              </div>

              {/* What is about to be sent, in full. No surprises. */}
              <div className="mt-7 rounded-sm border border-gold/20 bg-gold/[0.05] p-5">
                <p className={labelClass}>Your message</p>
                <pre className="mt-3 font-sans text-[0.8125rem] leading-relaxed whitespace-pre-wrap text-bone/85">
                  {message}
                </pre>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <MagneticButton
                  href={whatsappLink(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  cursorLabel="Send"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Send on WhatsApp
                </MagneticButton>
                <MagneticButton href={telLink()} variant="ghost" cursorLabel="Call">
                  <Phone className="size-4" aria-hidden="true" />
                  Call instead
                </MagneticButton>
              </div>

              <p className="mt-5 font-sans text-[0.75rem] leading-relaxed text-ash/65">
                This opens WhatsApp with the details filled in. Nothing is reserved until
                someone at {site.name} replies to confirm it.
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
