/**
 * Every business fact the site renders lives here.
 *
 * Fields marked TODO were not on the Google listing and are not known yet.
 * Components hide a row when its value is empty and fall back to an honest
 * "ask us" state when a number is null, so the site never shows a blank label
 * or an invented figure.
 */

export const site = {
  name: 'Anteiku',
  fullName: 'Anteiku Pool & Snooker',
  /** Google's own category for the listing. */
  category: 'Pool & billiards club',
  blurb:
    'A small pool and snooker cafe in Lado Sarai — two pool tables, one snooker table, and something to eat while you wait your turn.',

  contact: {
    /** From the Instagram bio: "Managed by @sejwalvinay 9899780172". */
    phone: '+91 98997 80172',
    /** Digits with country code, no plus. Used to build wa.me links. */
    whatsapp: '919899780172',
    /** TODO: no public email on the listing. Empty hides the row. */
    email: '',
  },

  address: {
    line1: 'F-157, near Bando Wali Chopal',
    line2: 'Bandalo Wala Mohalla, Lado Sarai',
    city: 'New Delhi',
    region: 'Delhi',
    pin: '110030',
    /** Search-by-name link, deliberately not a hand-written place ID. */
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Anteiku+Pool+and+Snooker+Lado+Sarai+New+Delhi',
    /** India Post DIGIPIN, from the Mappls listing. */
    digipin: '39J-4M5-LFLT',
  },

  social: {
    instagram: 'https://www.instagram.com/anteikucafe1/',
    igHandle: '@anteikucafe1',
  },

  /**
   * Google shows "Add full hours", so the real schedule is not published.
   * The footer prints `note` on its own until `weekly` has entries, at which
   * point it switches to the full table with no further change.
   */
  hours: {
    note: 'Open daily — call ahead for exact timings',
    /** TODO: e.g. { days: 'Mon – Thu', open: '11:00', close: '23:00' } */
    weekly: [] as ReadonlyArray<{ days: string; open: string; close: string }>,
  },

  /** As shown on the Google listing when this site was built. */
  rating: {
    score: 4.9,
    count: 108,
    source: 'Google',
  },

  /**
   * Verbatim snippets from the Google review summary, attributed on the page.
   * Not corrected for grammar — they are other people's words.
   */
  reviews: [
    {
      quote: 'Best cafe yummy food flavoured hookas and pool or snookers',
      source: 'Google review',
    },
    {
      quote: 'You can enjoy there very nice place and good vibe and good service',
      source: 'Google review',
    },
    {
      quote: 'Very awesome cafe had a lot of fun and the staff is very polite and friendly',
      source: 'Google review',
    },
  ],

  /**
   * TODO: real hourly rates. `price: null` renders "Rates on request" beside a
   * call button — it never renders a number nobody confirmed.
   */
  pricing: [
    {
      id: 'pool' as const,
      name: '8-Ball Pool',
      price: null as number | null,
      unit: 'per hour',
      blurb: 'Call your shot. Control the table.',
    },
    {
      id: 'snooker' as const,
      name: 'Snooker',
      price: null as number | null,
      unit: 'per hour',
      blurb: 'Patience, precision, and the perfect break.',
    },
  ],

  /**
   * The room's actual tables: two pool, one snooker.
   *
   * `size` is deliberately absent — the real table sizes were never given, and
   * the board prints only what it is told. Add `size: '8 ft'` to any row and it
   * appears beside the game; leave it off and nothing is shown.
   */
  tables: [
    { id: 'P1', game: 'pool', label: 'Pool 1' },
    { id: 'P2', game: 'pool', label: 'Pool 2' },
    { id: 'S1', game: 'snooker', label: 'Snooker 1' },
  ] as ReadonlyArray<{
    id: string;
    game: 'pool' | 'snooker';
    label: string;
    size?: string;
  }>,

  /**
   * TODO: real fixtures. An empty array renders "New events coming soon."
   * No invented dates, results or offers.
   */
  events: [] as ReadonlyArray<{
    title: string;
    date: string;
    blurb: string;
    image?: string;
  }>,
} as const;

export type Game = (typeof site.tables)[number]['game'];

/** wa.me link with an optional pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.contact.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** tel: link with the spaces stripped. */
export function telLink(): string {
  return `tel:${site.contact.phone.replace(/\s+/g, '')}`;
}
