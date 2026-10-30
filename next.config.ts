import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * The whole site is one static page, so it is exported as plain files:
   * `npm run build` writes `out/index.html` plus its assets, and that folder
   * can be uploaded to any host — Netlify, Vercel, GitHub Pages, cPanel —
   * with no Node running anywhere.
   *
   * It also means there is no `next start`; `npm start` serves the exported
   * folder instead (see scripts/serve-static.mjs).
   */
  output: 'export',

  /**
   * Relative asset paths, so `out/` works wherever it lands — including
   * double-clicked straight off the disk, where absolute `/_next/…` URLs
   * resolve to the drive root and find nothing.
   */
  assetPrefix: './',

  images: {
    // Required by `output: 'export'` — there is no server to resize on demand.
    // The asset script has already produced the sizes we need anyway.
    unoptimized: true,
  },

  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
