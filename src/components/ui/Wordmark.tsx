'use client';

/**
 * The nav lockup.
 *
 * The real emblem is a detailed red-and-gold crest — beautiful at poster size,
 * mud at 32px. So the navigation gets a drawn 8-ball and the name set in the
 * site's own display face, and the emblem itself appears large in the loader
 * and the footer, where its detail can actually be read.
 */

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className={`shrink-0 transition-[width,height] duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] ${
          compact ? 'size-6' : 'size-7'
        }`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="wm-ball" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#4c4f4d" />
            <stop offset="42%" stopColor="#151817" />
            <stop offset="100%" stopColor="#050706" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#wm-ball)" />
        <circle cx="16" cy="16" r="15" fill="none" stroke="#d6b46a" strokeWidth="1.1" opacity="0.6" />
        <circle cx="16" cy="16" r="7.4" fill="#f4f0e8" />
        <text
          x="16"
          y="16.6"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-display), sans-serif"
          fontSize="10"
          fontWeight="700"
          fill="#0b0d0c"
        >
          8
        </text>
        {/* The highlight, which is what makes it read as resin and not a dot. */}
        <ellipse cx="11" cy="9" rx="3.6" ry="2.3" fill="#ffffff" opacity="0.5" transform="rotate(-28 11 9)" />
      </svg>

      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-bold tracking-[0.17em] text-bone transition-[font-size] duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] ${
            compact ? 'text-[0.8125rem]' : 'text-[0.9375rem]'
          }`}
        >
          ANTEIKU
        </span>
        <span
          className={`overflow-hidden font-sans text-[0.5625rem] tracking-[0.3em] text-gold/75 uppercase transition-all duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] ${
            compact ? 'mt-0 max-h-0 opacity-0' : 'mt-1 max-h-4 opacity-100'
          }`}
        >
          Pool &amp; Snooker
        </span>
      </span>
    </span>
  );
}
