'use client';

/**
 * The site's one button.
 *
 * It leans toward the cursor as the cursor approaches, which is the whole of
 * the "magnetic" effect — no scale pop, no glow pulse. The pull is disabled for
 * coarse pointers and for anyone who asked for reduced motion, and in both
 * cases what remains is an ordinary, perfectly usable button.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/cn';
import { useFinePointer, useReducedMotion } from '@/lib/hooks/useEnvironment';

type Variant = 'primary' | 'ghost';

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Word the custom cursor shows while hovering this. */
  cursorLabel?: string;
  /** How far the button may travel toward the pointer, in px. */
  pull?: number;
}

type Props = BaseProps &
  (
    | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gold text-ink border-gold hover:bg-bone hover:border-bone ' +
    'shadow-[0_0_0_0_rgba(214,180,106,0)] hover:shadow-[0_8px_36px_-8px_rgba(214,180,106,0.55)]',
  ghost:
    'bg-transparent text-bone border-bone/25 hover:border-gold hover:text-gold ' +
    'hover:bg-gold/[0.06]',
};

export function MagneticButton({
  children,
  variant = 'primary',
  className,
  cursorLabel,
  pull = 10,
  ...rest
}: Props) {
  const host = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = host.current;
    if (!node || !fine || reduced) return;

    const moveX = gsap.quickTo(node, 'x', { duration: 0.5, ease: 'power3.out' });
    const moveY = gsap.quickTo(node, 'y', { duration: 0.5, ease: 'power3.out' });

    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      // Normalised against half the button, so the pull is proportional and
      // a wide button does not travel further than a narrow one.
      moveX(gsap.utils.clamp(-pull, pull, (dx / (box.width / 2)) * pull));
      moveY(gsap.utils.clamp(-pull, pull, (dy / (box.height / 2)) * pull));
    };

    const onLeave = () => {
      moveX(0);
      moveY(0);
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(node);
    };
  }, [fine, reduced, pull]);

  const classes = cn(
    'group relative inline-flex items-center justify-center gap-2.5',
    'rounded-full border px-7 py-3.5',
    'font-sans text-[0.8125rem] font-semibold uppercase tracking-[0.14em]',
    'transition-[background-color,border-color,color,box-shadow]',
    'duration-[var(--duration-hover)] ease-[var(--ease-out-quint)]',
    'will-change-transform',
    VARIANTS[variant],
    className,
  );

  if (rest.href !== undefined) {
    const { href, ...anchor } = rest as { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        ref={host as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={classes}
        data-cursor-label={cursorLabel}
        {...anchor}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={host as React.RefObject<HTMLButtonElement>}
      className={classes}
      data-cursor-label={cursorLabel}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
