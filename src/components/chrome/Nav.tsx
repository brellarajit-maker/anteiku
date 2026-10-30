'use client';

/**
 * Navigation.
 *
 * Transparent over the hero, then — once the hero is behind you — it contracts,
 * darkens, blurs, and grows a gold hairline. That is the only thing it does on
 * scroll; the section links do not animate, highlight, or slide.
 *
 * The mobile panel is a real dialog: focus moves into it, Escape closes it,
 * Tab is trapped inside, and the page behind it cannot scroll.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Wordmark } from '@/components/ui/Wordmark';
import { MagneticButton } from '@/components/ui/MagneticButton';

const LINKS = [
  { href: '#experience', label: 'The Experience' },
  { href: '#games', label: 'Our Games' },
  { href: '#tables', label: 'Tables' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#events', label: 'Events' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#visit', label: 'Visit' },
] as const;

export function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Plain scroll listener rather than a ScrollTrigger: this is one boolean,
    // and it should keep working even if GSAP never loads.
    const onScroll = () => setStuck(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    toggle.current?.focus();
  }, []);

  // Escape, focus trap, and a locked page body while the panel is open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const node = panel.current;
    const focusable = node?.querySelectorAll<HTMLElement>('a, button');
    focusable?.[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,padding] duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] ${
          stuck
            ? 'border-b border-gold/15 bg-ink/82 py-3 backdrop-blur-xl'
            : 'border-b border-transparent py-6'
        }`}
        style={{ paddingTop: stuck ? undefined : 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <nav className="gutter flex items-center justify-between gap-6" aria-label="Main">
          <a href="#home" className="shrink-0" aria-label="Anteiku Pool and Snooker, home">
            <Wordmark compact={stuck} />
          </a>

          {/* Seven links, a wordmark and a call to action need real room —
              below 1280px they wrap, so the panel takes over instead. */}
          <ul className="hidden items-center gap-7 xl:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group relative font-sans text-[0.6875rem] font-medium tracking-[0.16em] text-ash uppercase transition-colors duration-[var(--duration-hover)] hover:text-bone"
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out-quint)] group-hover:scale-x-100"
                  />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <MagneticButton
              href="#book"
              cursorLabel="Book"
              className="hidden px-5 py-2.5 text-[0.6875rem] sm:inline-flex"
              pull={6}
            >
              Book a table
            </MagneticButton>

            <button
              ref={toggle}
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-[var(--duration-hover)] hover:border-gold hover:text-gold xl:hidden"
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              <Menu className="size-5" aria-hidden="true" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile panel. */}
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        // `invisible`, not the `hidden` attribute: the `flex` class beats the
        // browser's [hidden] rule, so the closed panel stayed in the tab order
        // and keyboard users walked through nine controls they could not see.
        // Opacity only. Transitioning visibility as well would hold it hidden
        // for half the duration, and the focus move below would land on
        // nothing.
        className={`fixed inset-0 z-[60] flex flex-col bg-ink/97 backdrop-blur-2xl transition-opacity duration-[var(--duration-panel)] ease-[var(--ease-out-quint)] xl:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div
          className="gutter flex items-center justify-between py-6"
          style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
        >
          <Wordmark />
          <button
            type="button"
            onClick={close}
            className="inline-flex size-11 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors hover:border-gold hover:text-gold"
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <ul className="gutter flex flex-1 flex-col justify-center gap-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={close}
                className="block py-3 font-display text-[clamp(2rem,9vw,3rem)] font-bold text-bone transition-colors duration-[var(--duration-hover)] hover:text-gold"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div
          className="gutter pb-[max(2rem,env(safe-area-inset-bottom))]"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          <MagneticButton href="#book" onClick={close} className="w-full" pull={0}>
            Book a table
          </MagneticButton>
        </div>
      </div>
    </>
  );
}
