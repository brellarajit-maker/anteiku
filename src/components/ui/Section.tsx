'use client';

/**
 * Section shell and heading.
 *
 * Every section below the hero uses these, which is most of why the page holds
 * together: one vertical rhythm, one heading construction, one rule.
 */

import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';
import { Watermark } from './Watermark';

export function Section({
  id,
  children,
  className,
  tone = 'ink',
  rule = true,
  watermark,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  /** `forest` lifts a section a step out of the black. */
  tone?: 'ink' | 'forest';
  rule?: boolean;
  /** Whether this section carries the centred emblem watermark. */
  watermark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative isolate scroll-mt-24 overflow-hidden py-24 md:py-32 lg:py-40',
        tone === 'forest' ? 'bg-forest' : 'bg-ink',
        rule && 'rule-gold',
        className,
      )}
    >
      {watermark && <Watermark tone={tone} />}
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <header
      className={cn('flex flex-col', align === 'center' && 'items-center text-center', className)}
    >
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="mt-5 text-[clamp(2rem,5.2vw,3.75rem)]">{title}</h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.16}>
          <p
            className={cn(
              'measure mt-6 font-sans text-base leading-relaxed text-ash sm:text-[1.0625rem]',
              align === 'center' && 'mx-auto',
            )}
          >
            {lede}
          </p>
        </Reveal>
      )}
    </header>
  );
}
