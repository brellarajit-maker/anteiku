'use client';

/**
 * The hero.
 *
 * The table is the page's whole visual identity, so it gets the frame and the
 * copy sits in the dark room above it. The headline is held back until the
 * break has settled — the visitor watches the rack go, then the words arrive on
 * the stillness afterwards. If the scene cannot run, or motion is turned down,
 * the same copy is simply there from the first paint.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Star } from 'lucide-react';
import { TableStage } from '@/components/table/TableStage';
import { MagneticButton } from '@/components/ui/MagneticButton';
import type { Phase } from '@/components/table/TableScene';
import { site } from '@/lib/site';
import { useIntroDone } from '@/components/chrome/Intro';
import { Prop3D } from '@/components/three/Prop3D';
import { PropLights, SpinningBall } from '@/components/three/props';
import { useDeviceTier, useReducedMotion } from '@/lib/hooks/useEnvironment';

export function Hero() {
  const copy = useRef<HTMLDivElement>(null);
  const [sceneSettled, setSceneSettled] = useState(false);
  const [waitedLongEnough, setWaitedLongEnough] = useState(false);
  const [phase, setPhase] = useState<Phase>('intro');
  /** Bumped when the booking button is pressed, to play the camera hand-off. */
  const [pushIn, setPushIn] = useState(0);
  /** True for a few seconds after the floating ball is clicked. */
  const [poked, setPoked] = useState(false);
  const pokeTimer = useRef<number | null>(null);

  const poke = useCallback(() => {
    setPoked(true);
    if (pokeTimer.current) window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setPoked(false), 3200);
  }, []);

  useEffect(() => () => {
    if (pokeTimer.current) window.clearTimeout(pokeTimer.current);
  }, []);
  const tier = useDeviceTier();
  const reduced = useReducedMotion();
  // The break waits for the curtain, so the rack is not already scattered by
  // the time the visitor can see it.
  const introDone = useIntroDone();

  /**
   * The copy is never allowed to depend on the scene finishing. It appears
   * when the break settles, or on a timer, or immediately if there is no scene
   * to wait for — so a backgrounded tab or a crawling GPU can never leave the
   * page wordless.
   */
  const revealed = sceneSettled || waitedLongEnough || tier === 'none' || reduced;

  useEffect(() => {
    if (!introDone) return;
    const id = window.setTimeout(() => setWaitedLongEnough(true), 5200);
    return () => window.clearTimeout(id);
  }, [introDone]);

  const onPhaseChange = useCallback((next: Phase) => {
    setPhase(next);
    if (next === 'ready') setSceneSettled(true);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const node = copy.current;
    if (!node) return;

    const lines = node.querySelectorAll('[data-reveal]');
    if (reduced) {
      gsap.set(lines, { opacity: 1, y: 0 });
      return;
    }

    const tween = gsap.fromTo(
      lines,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.085,
        ease: 'power3.out',
      },
    );
    return () => {
      tween.kill();
    };
  }, [revealed, reduced]);

  return (
    <section
      id="home"
      className="relative isolate min-h-svh w-full overflow-hidden bg-ink"
      aria-label="Anteiku Pool and Snooker"
    >
      {/* The table. Sits behind everything and is decorative to a screen
          reader — the copy below carries the meaning. */}
      {/* Held below the headline rather than filling the section: the table
          keeps its own band of the screen and the type keeps the dark room
          above it, so neither has to compromise for the other. */}
      <TableStage
        className="absolute inset-x-0 bottom-0 -z-10 top-[34%] sm:top-[30%] lg:top-[19%]"
        armed={introDone}
        pushIn={pushIn}
        onPhaseChange={onPhaseChange}
      />

      {/* Static stand-in: the room's light, for when there is no WebGL. The
          scene renders over it when it can. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(90%_60%_at_50%_72%,#16412c_0%,#0b1611_45%,#080a09_100%)]"
      />

      {/* Scrim under the type only, so the cloth keeps its contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-[62%] bg-[linear-gradient(to_bottom,rgba(8,10,9,0.93)_0%,rgba(8,10,9,0.72)_38%,rgba(8,10,9,0)_100%)]"
      />

      {/*
        This wrapper is full height and sits over the canvas, so it must not
        take pointer events — otherwise it swallows every press meant for the
        table and the shot never happens. Only the copy block itself is
        interactive, so the text stays selectable and the buttons work.
      */}
      <div className="gutter pointer-events-none relative flex min-h-svh flex-col justify-start pt-[max(7.5rem,calc(env(safe-area-inset-top)+7rem))]">
        {/* Narrower on wide screens so the floating ball below has a column of
            its own — the shared canvas paints over whatever is inside a view's
            box, so the two must not overlap. */}
        <div ref={copy} className="pointer-events-auto max-w-[72rem] xl:max-w-[56rem]">
          <div data-reveal className="flex items-center gap-3 opacity-0">
            <span className="eyebrow">{site.category} · Lado Sarai</span>
            <span aria-hidden="true" className="h-px w-8 bg-gold/35" />
            <span className="inline-flex items-center gap-1.5 font-sans text-xs text-ash">
              <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
              <span>
                {site.rating.score}
                <span className="sr-only"> out of 5</span>
              </span>
              <span className="text-ash/55">
                ({site.rating.count} {site.rating.source} reviews)
              </span>
            </span>
          </div>

          <h1 className="mt-7 text-[clamp(2.6rem,8.4vw,7rem)]">
            <span data-reveal className="block opacity-0">
              Own the table.
            </span>
            <span data-reveal className="block text-gold opacity-0">
              Play the night.
            </span>
          </h1>

          <p
            data-reveal
            className="measure mt-7 font-sans text-[1.0625rem] leading-relaxed text-ash opacity-0 sm:text-lg"
          >
            Precision, competition, and good times. Your next favourite spot is waiting.
          </p>

          <div data-reveal className="mt-10 flex flex-wrap items-center gap-3.5 opacity-0">
            <MagneticButton
              href="#book"
              cursorLabel="Book"
              // The anchor still does the navigating; this only asks the table
              // to push in as the page sets off.
              onClick={() => setPushIn((n) => n + 1)}
            >
              Book your table
            </MagneticButton>
            <MagneticButton href="#experience" variant="ghost" cursorLabel="View">
              See the room
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* The floating 8-ball. Only where there is a free column for it. */}
      <div className="pointer-events-none absolute top-[28%] right-[max(1.5rem,3vw)] hidden xl:block">
        <Prop3D className="size-40" interactive>
          <PropLights />
          <SpinningBall number={8} radius={0.72} speed={0.3} spinnable onPoke={poke} />
        </Prop3D>
        <p
          className={`mt-3 text-center font-sans text-[0.625rem] tracking-[0.22em] uppercase transition-opacity duration-[var(--duration-panel)] ${
            poked ? 'text-gold opacity-100' : 'text-ash/50 opacity-70'
          }`}
        >
          {poked ? 'Ready to break?' : 'Spin me'}
        </p>
      </div>

      {/* Play hint. Only once the table is live, and never on touch, where
          there is no cue ball small enough to drag precisely. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 hidden justify-center pb-[max(1.75rem,env(safe-area-inset-bottom))] transition-opacity duration-[var(--duration-panel)] md:flex ${
          phase === 'ready' || phase === 'aiming' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="font-sans text-[0.6875rem] tracking-[0.2em] text-ash/60 uppercase">
          Drag back from the cue ball to take a shot
        </p>
      </div>
    </section>
  );
}
