import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { site } from '@/lib/site';
import { Shell } from '@/components/chrome/Shell';
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-face',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body-face',
  display: 'swap',
});

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL to the live domain at deploy time, or the social
  // card and canonical URLs will point at localhost.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3210'),
  title: {
    default: `${site.fullName} — Lado Sarai, New Delhi`,
    template: `%s — ${site.fullName}`,
  },
  description: site.blurb,
  applicationName: site.fullName,
  keywords: [
    'pool',
    'snooker',
    '8-ball',
    'billiards',
    'Lado Sarai',
    'Saket',
    'Mehrauli',
    'New Delhi',
    'pool table booking',
    'cafe',
  ],
  openGraph: {
    type: 'website',
    siteName: site.fullName,
    title: `${site.fullName} — Lado Sarai, New Delhi`,
    description: site.blurb,
    locale: 'en_IN',
    images: [{ url: '/brand/og.png', width: 1200, height: 630, alt: site.fullName }],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.fullName,
    description: site.blurb,
    images: ['/brand/og.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#080a09',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // The hero runs under the notch; sections pad themselves back out.
  viewportFit: 'cover',
};

/**
 * Local-business structured data, built from the same source the page renders
 * from — so it can never describe a different business to search engines than
 * the one on screen. Hours are omitted deliberately: they are not known, and
 * publishing guessed hours is worse than publishing none.
 */
function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: site.fullName,
    description: site.blurb,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.pin,
      addressCountry: 'IN',
    },
    telephone: site.contact.phone,
    sameAs: [site.social.instagram],
    hasMap: site.address.mapsUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.rating.score,
      reviewCount: site.rating.count,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body>
        {/*
          Declared as a plain tag rather than as a file in app/ or via the
          `icons` metadata field: both of those emit an absolute "/icon.svg",
          which resolves to the drive root when the export is opened straight
          off the disk. React hoists this into <head> with the href exactly as
          written — it has to sit inside <body>, since markup between </head>
          and <body> is not a valid place for it.
        */}
        <link rel="icon" href="./icon.svg" type="image/svg+xml" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-5 focus:py-2.5 focus:font-sans focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <Shell>{children}</Shell>
        <script
          type="application/ld+json"
          // Built above from `site`, not from anything a visitor can influence.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
      </body>
    </html>
  );
}
