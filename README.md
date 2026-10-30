# Anteiku Pool & Snooker

A site for the pool and snooker club at F-157, Lado Sarai, New Delhi.

One 3D pool table carries the whole thing. It breaks a rack when the page
opens, settles into the hero framing, and then you can take a shot on it —
drag back from the cue ball and let go. Everything below the hero is flat,
typographic and deliberately still, so the table stays the only moving thing.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Three.js via
React Three Fiber · GSAP + ScrollTrigger · Lenis.

---

## Seeing it

**There is no `index.html` to open.** A Next.js project is written as
components and compiled; the homepage is `src/app/page.tsx`. To look at the
site you either run it, or build it into plain files first.

### The easy way

Double-click **`preview.cmd`** in this folder. It finds Node, installs
anything missing on first run, starts the server and opens the browser at
**http://localhost:3210**. Close the window to stop it.

### Plain files you can upload

```bash
npm run build
```

writes **`out/index.html`** and everything it needs. That folder is the whole
site — drop it on Netlify, Vercel, GitHub Pages, or any shared host, with no
Node running anywhere.

`npm start` then serves that folder at **http://localhost:3211** so you can
check it before uploading.

**You can also just double-click `out/index.html`.** The build uses relative
asset paths (`assetPrefix: './'`) and Next emits classic script tags rather
than ES modules, so the page loads straight off the disk. Web fonts may be
blocked by the browser's file:// rules and fall back to a system face — serve
it with `npm start` if the type looks wrong.

### Going live

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `main`. **One manual step first:** in the repository, go to
**Settings → Pages** and set **Source** to **GitHub Actions**. After that it
deploys itself to
`https://brellarajit-maker.github.io/anteiku`.

Pages serves a project repo from a sub-path, which works here only because the
page's own assets are relative. Absolute URLs in the metadata (the social card)
come from `NEXT_PUBLIC_SITE_URL`, set in the workflow — change it there if you
move to a custom domain.

### From a terminal

**Node is installed but not on this machine's PATH**, at
`C:\Users\User\AppData\Local\Programs\nodejs`. Add that folder to PATH once, or
prefix commands:

```bash
export PATH="/c/Users/User/AppData/Local/Programs/nodejs:$PATH"
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload, port 3210 |
| `npm run build` | Static export into `out/` |
| `npm start` | Serve `out/` at port 3211 |
| `npm run lint` | ESLint |
| `npm run assets` | Rebuild images from the asset library (see below) |
| `npm run check:physics` | Headless assertions against the billiards solver |

> **One thing I had to repair.** The npm that shipped with your Node install was
> gutted — the directory tree existed with zero files in it, so no package
> manager at all. I reinstalled npm (12.2.1) from the registry into
> `…\Programs\nodejs`. Nothing else on your machine was touched.

---

## Assets

You pointed me at `C:\Users\User\Desktop\anteiku cafe` and I read
`anteiku logo.PNG` from it. **That folder disappeared from the Desktop part-way
through the build** — I did not move or delete it, and I could not find the file
anywhere else under Desktop afterwards. I don't know what happened to it.

So that the build was not blocked, the logo you originally pasted into the chat
is checked in at `assets-source/anteiku-logo.webp` and the asset script falls
back to it. Put the folder back and it takes priority again automatically.

```bash
npm run assets
```

- Reads `C:/Users/User/Desktop/anteiku cafe` if it exists, otherwise
  `assets-source/`. Override with `ANTEIKU_ASSETS=/some/path`.
- Any file with `logo` in the name becomes the emblem: `public/brand/emblem-512.webp`,
  `emblem-1024.webp`, and `og.png` for link previews.
- **Everything else is treated as a photograph** and gets resized to 640/1280/1920,
  converted to WebP, given a blurred inline placeholder, and listed in
  `src/lib/photos.generated.ts`.

The pasted logo was on a white background, so the script keys it out by flooding
inward from the border — that clears only white connected to the outside, which
is why the white disc on the 8-ball and the cream lettering survive.

### Photographs

**There are none yet, and the site says so rather than using stock.** Every
image slot renders a labelled placeholder naming the shot it wants. Drop a file
into the asset library with the matching name, run `npm run assets`, and the
slot fills in with no code change:

| File name | The shot |
|---|---|
| `room-wide` | The main room, tables under their lamps, cafe behind |
| `table-detail` | Close on the baize — chalk, a resting cue, balls mid-frame |
| `room-night` | The room after dark, lamps down over the tables |
| `break-shot` | A break, mid-scatter |
| `cafe-counter` | The counter and the food coming out |
| `cues-rack` | Cues on the wall rack, chalk and rests |
| `friends-playing` | Friends around a table mid-frame, laughing |

The gallery lightbox only activates for frames that have a real photograph.

---

## What is real, and what is still waiting on you

Everything the site states about the business lives in **`src/lib/site.ts`**.
Real facts came off your Google listing, Justdial and the Instagram bio.

**Real:** the name, the address and DIGIPIN, the phone number
(+91 98997 80172, from the Instagram bio), `@anteikucafe1`, the 4.9 / 108
Google rating, and the three review quotes — those are verbatim, attributed,
and not tidied up.

**Not known, and therefore not invented** — each is marked `TODO` in
`site.ts`:

1. **Opening hours.** Google shows "Add full hours". The footer prints one
   honest line instead of a made-up weekly table. Fill in `hours.weekly` and it
   switches to the full table by itself.
2. **Prices.** Both tiers render "Rates on request" next to a call button. Put
   a number in `pricing[].price` and the card prints `₹N per hour` instead.
3. **The table list.** `site.tables` currently describes a plausible floor
   (four pool, two snooker). Set it to your real tables — the availability
   board and the floor count both read from it.
4. **Events.** `site.events` is empty, so the section shows "New events coming
   soon." with a private-hire enquiry button. No invented fixtures.
5. **Email.** No public address was listed, so the row is hidden. Add
   `contact.email` and it appears.
6. **`NEXT_PUBLIC_SITE_URL`.** Set it at deploy time or social cards will
   point at localhost.

### Booking

There is no booking backend, so the form does not pretend to confirm anything.
It builds a complete message, shows you exactly what will be sent, and hands it
to WhatsApp pre-filled. The note under the button says plainly that nothing is
held until someone replies. That is a real working enquiry route — which is why
it is not labelled a demo.

---

## The live availability board

This was your idea and it is built, including the part that matters: **it never
claims a table is free on data nobody supplied.**

`src/lib/availability.ts` defines an `AvailabilitySource`. Three states:

- **`unconnected`** (the default) — every table reads "Ask us", the banner says
  "Live status not connected", and the call button is offered instead.
- **`demo`** — plausible occupancy so you can see the design. While it is on,
  the banner reads "Demo data — not real availability". The toggle only appears
  when nothing real is connected.
- **`live`** — yours to write.

To go live, write an adapter that returns `TableStatus[]` from your booking
system and pass it in `src/app/page.tsx`:

```tsx
<Availability source={myBookingSystem} />
```

It then polls every 60 seconds, shows a last-updated time and a manual refresh,
and — if a read throws — drops every table back to "Ask us" rather than leaving
stale numbers on screen. Nothing else needs changing.

---

## The table

`src/lib/pool/physics.ts` is a top-down billiards solver: balls as circles on a
plane, real dimensions (88″ × 44″ playfield, 2¼″ balls), rolling friction,
elastic ball-on-ball collisions, cushion rebound with tangential damping, and
pocket capture that runs *before* cushion reflection so a ball entering a jaw
drops instead of bouncing off the rail running past it. The renderer lifts each
ball to a sphere and spins it from the rotation the solver accumulated.

It integrates at a fixed 240 Hz, so the result does not change with frame rate.
`npm run check:physics` asserts the properties that matter — 18 checks covering
settling, containment, no overlap, no energy created, pocket capture, cushion
rebound, and that 30 Hz and 120 Hz agree to within 1e-9.

**The camera is described as an angle, never a position.** Each frame the
distance is solved from the viewport so the table is framed with the same margin
on an ultrawide monitor and on a phone. Portrait rotates the table a quarter
turn rather than shrinking it, so the balls stay the same size on a phone.

Performance: one WebGL canvas on the whole site. It stops rendering entirely
when the hero scrolls out of view or the tab goes to the background. Shadows,
antialiasing and post-processing are dropped on small/low-core/save-data
devices. Without WebGL the hero falls back to a static gradient with the copy
and buttons unchanged. `prefers-reduced-motion` skips the entrance and the break
and opens on a table that has genuinely already been played — the solver runs
headlessly to produce the spread rather than faking one.

---

## Where I departed from the brief, and why

1. **No React Three Rapier.** A 3D rigid-body engine on a flat table fights you
   — balls jitter, sink into the cloth and spin wrongly. A 2D solver rendered as
   spheres is more convincing and far cheaper. Your brief allowed "a lightweight
   physics implementation rather than an expensive full simulation".

2. **No Framer Motion.** GSAP + ScrollTrigger does scroll, timelines and
   choreography; adding a second animation system is the duplication the brief
   warned about, and two of them competing for the same properties is a real
   source of bugs.

3. **No shadcn/ui.** Its value is Radix's accessibility, but this form is radio
   groups, native date/time inputs, a select and buttons — all natively
   accessible. Pulling in Radix plus shadcn's visual defaults would have fought
   the bespoke look for no gain.

4. **The mini pool game is the hero table.** Per your note: rather than a second
   WebGL canvas further down, you take your shot on the same table you landed
   on. One scene, one physics world.

5. **The scroll-driven 8-ball and the floating 3D objects are cut.** Also per
   your note — these were the parts most likely to read as "animated for the
   sake of it".

6. **The loading screen is short.** The break *is* the cinematic opening; a
   ball rolling at the camera before it would be two introductions in a row. The
   curtain covers the font and emblem load, never holds longer than 3.2 s, is
   skippable with any key or click, and shortens to a fade on repeat visits.

7. **"The perfect break" is a hand-off, not a takeover.** Pressing *Book your
   table* in the hero makes the camera drop and push in on the table as the page
   sets off for the booking panel. You asked to keep booking simple; a
   full-screen cinematic in front of someone who has just decided to book would
   be in the way.

---

## Accessibility

Semantic landmarks and one `h1`. Skip link. Visible gold focus ring on
everything, never removed. The mobile menu and the gallery lightbox are real
dialogs — focus moves in, Tab is trapped, Escape closes, focus returns. The
custom cursor only mounts for a real pointer that can hover, and `cursor: none`
is applied by an attribute that component owns, so a failure can never leave the
page with no pointer. `prefers-reduced-motion` is honoured by the CSS, every
GSAP timeline, and the 3D scene. The hero copy reveals on a timer that does not
depend on the 3D finishing, so a backgrounded tab or slow GPU can never leave
the page wordless. The canvas is `aria-hidden` — it is decoration, and the copy
carries the meaning.

---

## File map

```
src/
  app/
    layout.tsx            fonts, metadata, LocalBusiness JSON-LD
    page.tsx              section order
    globals.css           palette, type, motion tokens, utilities
  components/
    chrome/               Intro curtain, Nav, Footer, cursor, Lenis
    hero/Hero.tsx         headline, CTAs, reveal timing
    table/                the one 3D scene
      TableScene.tsx      camera solver, break choreography, aiming
      PoolTable.tsx       slate, cushions with real pocket mouths, rails
      Balls.tsx           renders solver state
      Lighting.tsx        two shades + procedural environment
      TableStage.tsx      canvas, device tiering, pause when off-screen
    sections/             Experience, PickYourGame, Availability,
                          Gallery, Events, Booking
    ui/                   Section, Reveal, Photo, MagneticButton, BallGraphic
  lib/
    site.ts               every business fact — start here
    availability.ts       the booking-data adapter
    pool/physics.ts       the solver
    pool/appearance.ts    procedural ball, cloth and wood textures
scripts/
  assets.mjs              asset library → public/
  check-physics.ts        headless solver assertions
```

No texture or model files are downloaded or shipped — the balls, baize and
walnut are all drawn on a canvas at runtime, and the environment the balls
reflect is built from light shapes rather than an HDR file.
