import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names, letting later ones win over earlier ones.
 *
 * Plain `clsx` only concatenates, so a component that sets `inline-flex` on
 * itself and is then handed `hidden sm:inline-flex` ends up with both — and
 * which one applies comes down to the order Tailwind happened to emit them in,
 * not the order you wrote them. `twMerge` resolves the conflict properly, so a
 * caller can always override a base class.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
