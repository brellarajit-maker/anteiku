import { Hero } from '@/components/hero/Hero';
import { Experience } from '@/components/sections/Experience';
import { PickYourGame } from '@/components/sections/PickYourGame';
import { Availability } from '@/components/sections/Availability';
import { Gallery } from '@/components/sections/Gallery';
import { Events } from '@/components/sections/Events';
import { Booking } from '@/components/sections/Booking';
import { Footer } from '@/components/chrome/Footer';

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <Experience />
        <PickYourGame />
        {/*
          Availability takes its data from a source object. Swap `unconnected`
          (the default) for an adapter that reads the real booking system and
          the board goes live with no other change — see src/lib/availability.ts
        */}
        <Availability />
        <Gallery />
        <Events />
        <Booking />
      </main>
      <Footer />
    </>
  );
}
