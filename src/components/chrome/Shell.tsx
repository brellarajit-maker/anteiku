'use client';

/**
 * Everything that wraps the page: the entrance curtain, smooth scrolling, the
 * navigation and the cursor.
 *
 * It is one client component so the page itself stays a server component and
 * the sections render on the server.
 */

import { IntroProvider } from './Intro';
import { SmoothScroll } from './SmoothScroll';
import { Nav } from './Nav';
import { CustomCursor } from './CustomCursor';
import { ViewCanvas } from '@/components/three/ViewCanvas';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <IntroProvider>
      <SmoothScroll>
        {/* Hosts every 3D prop outside the hero in a single WebGL context. */}
        <ViewCanvas>
          <Nav />
          {children}
          <CustomCursor />
        </ViewCanvas>
      </SmoothScroll>
    </IntroProvider>
  );
}
