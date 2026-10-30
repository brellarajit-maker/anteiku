/**
 * Brings the asset library into the site.
 *
 *   node scripts/assets.mjs
 *
 * The library is the folder you keep the real photographs and the logo in.
 * Drop files there, run this, and they arrive in `public/` already resized,
 * converted to WebP, and paired with a tiny blurred placeholder so the gallery
 * has something to show while the full image loads.
 *
 * Override the library with ANTEIKU_ASSETS=/some/other/folder.
 */

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Forward slashes on purpose: Node accepts them on Windows, and they survive
// every shell, editor and JSON round trip that eats backslashes.
const LIBRARY = process.env.ANTEIKU_ASSETS ?? 'C:/Users/User/Desktop/anteiku cafe';
/** Checked in, so a fresh clone can build without the external library. */
const FALLBACK = path.join(process.cwd(), 'assets-source');
const PUBLIC = path.join(process.cwd(), 'public');

/** Anything whose name contains this is treated as the logo, not a photo. */
const LOGO_HINT = 'logo';
const PHOTO_WIDTHS = [640, 1280, 1920];
const IMAGE_TYPES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tif', '.tiff']);

async function ensure(dir) {
  await mkdir(dir, { recursive: true });
}

/**
 * Knocks a white background off the crest.
 *
 * A plain "make every near-white pixel transparent" rule would also punch out
 * the white disc on the 8-ball and the highlights on the cues. So this floods
 * inward from the border instead and only clears white that is *connected to
 * the outside*, which leaves every white inside the artwork alone.
 */
async function keyOutWhite(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const at = (x, y) => (y * width + x) * 4;

  const alreadyTransparent = (() => {
    for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
    return false;
  })();
  if (alreadyTransparent) return sharp(file).ensureAlpha();

  const isWhite = (x, y) => {
    const o = at(x, y);
    return data[o] > 234 && data[o + 1] > 234 && data[o + 2] > 234;
  };

  const seen = new Uint8Array(width * height);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const key = y * width + x;
    if (seen[key] || !isWhite(x, y)) return;
    seen[key] = 1;
    queue.push(key);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const key = queue[head];
    const x = key % width;
    const y = (key / width) | 0;
    data[at(x, y) + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Soften the cut by one pixel, so the crest's edge is not stair-stepped.
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = data[i * 4 + 3];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const key = y * width + x;
      if (alpha[key] === 0) continue;
      let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1)
        for (let dx = -1; dx <= 1; dx += 1) sum += alpha[key + dy * width + dx];
      const average = sum / 9;
      if (average < 255) data[key * 4 + 3] = Math.round(average);
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } });
}

async function buildEmblem(file) {
  const out = path.join(PUBLIC, 'brand');
  await ensure(out);

  const { width, height } = await sharp(file).metadata();
  console.log(`  logo: ${path.basename(file)} (${width}×${height})`);

  const keyed = await keyOutWhite(file);
  const master = await keyed.png().toBuffer();

  for (const size of [512, 1024]) {
    await sharp(master)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 92 })
      .toFile(path.join(out, `emblem-${size}.webp`));
    console.log(`    → brand/emblem-${size}.webp`);
  }

  // A flattened copy on the site's own black, for link previews — social
  // cards render transparency as white, which would wreck the crest.
  await sharp(master)
    .resize(1100, 560, { fit: 'contain', background: { r: 8, g: 10, b: 9, alpha: 1 } })
    .extend({
      top: 35,
      bottom: 35,
      left: 50,
      right: 50,
      background: { r: 8, g: 10, b: 9, alpha: 1 },
    })
    .flatten({ background: { r: 8, g: 10, b: 9 } })
    .png()
    .toFile(path.join(out, 'og.png'));
  console.log('    → brand/og.png');
}

async function buildPhoto(file) {
  const out = path.join(PUBLIC, 'photos');
  await ensure(out);

  const name = path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const meta = await sharp(file).metadata();

  // Track what was actually written, so `src` and `srcSet` below can never
  // name a size this photo was too small to produce.
  const written = [];
  for (const width of PHOTO_WIDTHS) {
    if (meta.width && meta.width < width && width !== PHOTO_WIDTHS[0]) continue;
    await sharp(file)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(out, `${name}-${width}.webp`));
    written.push(width);
  }

  // 20px wide, blurred — inlined as a data URI behind the real image.
  const placeholder = await sharp(file).resize(20).blur(1.2).webp({ quality: 40 }).toBuffer();

  console.log(`  photo: ${name} (${meta.width}×${meta.height})`);
  return {
    name,
    width: meta.width ?? null,
    height: meta.height ?? null,
    // Relative, like every other asset path in the build — an absolute "/photos/…"
    // resolves to the drive root when the export is opened straight off the disk.
    src: `./photos/${name}-${written[written.length - 1]}.webp`,
    srcSet: written.map((w) => `./photos/${name}-${w}.webp ${w}w`).join(', '),
    blurDataURL: `data:image/webp;base64,${placeholder.toString('base64')}`,
  };
}

async function main() {
  const source = existsSync(LIBRARY) ? LIBRARY : FALLBACK;

  if (!existsSync(source)) {
    console.error(`\nNo asset source found. Looked in:`);
    console.error(`  ${LIBRARY}`);
    console.error(`  ${FALLBACK}`);
    console.error('Set ANTEIKU_ASSETS to the folder holding the logo and photographs.\n');
    process.exit(1);
  }

  if (source === FALLBACK) {
    console.log(`\nAsset library not found at ${LIBRARY}`);
    console.log('Falling back to the copy checked in at assets-source/');
  }

  console.log(`\nReading ${source}`);
  const entries = await readdir(source, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && IMAGE_TYPES.has(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(source, e.name));

  if (files.length === 0) {
    console.log('  nothing to do — no images in the library\n');
    return;
  }

  const photos = [];
  for (const file of files) {
    if (path.basename(file).toLowerCase().includes(LOGO_HINT)) {
      await buildEmblem(file);
    } else {
      photos.push(await buildPhoto(file));
    }
  }

  // A manifest the gallery reads, so adding a photograph to the library is the
  // whole of adding a photograph to the site.
  await ensure(path.join(process.cwd(), 'src', 'lib'));
  await writeFile(
    path.join(process.cwd(), 'src', 'lib', 'photos.generated.ts'),
    `// Generated by scripts/assets.mjs — do not edit by hand.\n` +
      `// Run \`npm run assets\` after changing the asset library.\n\n` +
      `export interface Photo {\n` +
      `  name: string;\n  width: number | null;\n  height: number | null;\n` +
      `  src: string;\n  srcSet: string;\n  blurDataURL: string;\n}\n\n` +
      `export const photos: Photo[] = ${JSON.stringify(photos, null, 2)};\n`,
    'utf8',
  );

  console.log(`\n${photos.length} photograph(s) ready, manifest written\n`);
}

await main();
