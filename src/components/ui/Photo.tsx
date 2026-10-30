'use client';

/**
 * A photograph from the asset library, or an honest hole where one goes.
 *
 * The brief was explicit about not using stock photography that does not match
 * the room, and there are no photographs of Anteiku in the library yet. So
 * rather than dressing the page with someone else's billiards hall, every
 * image slot renders a labelled placeholder that says what belongs there and
 * how to supply it. Drop the file into the asset library, run `npm run assets`,
 * and the same slot fills in with no code change.
 */

import { BallGraphic } from '@/components/ui/BallGraphic';
import { cn } from '@/lib/cn';
import { photos } from '@/lib/photos.generated';

export interface PhotoProps {
  /** Matches the file name in the asset library, lower-cased and hyphenated. */
  name: string;
  /** Shown to screen readers, and as the placeholder's brief. */
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function Photo({ name, alt, className, sizes = '100vw', priority }: PhotoProps) {
  const photo = photos.find((p) => p.name === name);

  if (!photo) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-sm',
          'border border-dashed border-gold/22 bg-forest-raised',
          className,
        )}
        role="img"
        aria-label={`Photograph placeholder: ${alt}`}
      >
        {/* Faint baize, so a wall of these still reads as the same room. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_40%,rgba(18,107,69,0.3),transparent_72%)]"
        />
        <span className="relative flex max-w-[22rem] flex-col items-center gap-4 px-6 py-10 text-center">
          <BallGraphic
            number={8}
            className="size-14 animate-[prop-float_5s_ease-in-out_infinite] opacity-85"
          />
          <span className="font-sans text-[0.8125rem] leading-snug text-bone/80">{alt}</span>
          <span className="font-sans text-[0.5625rem] tracking-[0.22em] text-ash/55 uppercase">
            Add <span className="text-gold/70">{name}</span> to the asset library
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-sm bg-forest-raised', className)}>
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={sizes}
        alt={alt}
        width={photo.width ?? undefined}
        height={photo.height ?? undefined}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="size-full object-cover"
        style={{
          backgroundImage: `url(${photo.blurDataURL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    </div>
  );
}
