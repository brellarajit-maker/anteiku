/**
 * Procedural materials for the table.
 *
 * Every texture here is drawn on a canvas at runtime rather than loaded, which
 * keeps numbers crisp at any camera distance, removes a network round trip from
 * the hero's critical path, and means the site ships no binary texture assets.
 *
 * Browser only — these touch `document`.
 */

import * as THREE from 'three';

/**
 * Standard pool colours, pulled a little deeper and less saturated than the
 * plastic originals so they sit inside the site's palette under a warm lamp.
 */
const BALL_HUES: Record<number, string> = {
  1: '#d9a21b', // yellow
  2: '#1b4f9c', // blue
  3: '#b4272c', // red
  4: '#55297d', // purple
  5: '#d1661b', // orange
  6: '#17704a', // green
  7: '#762c32', // maroon — the logo's red
  8: '#0b0d0c', // black
};

export function ballHue(number: number): string {
  if (number === 0) return '#f4f0e8';
  return BALL_HUES[number > 8 ? number - 8 : number] ?? '#f4f0e8';
}

const textureCache = new Map<number, THREE.CanvasTexture>();

/**
 * One ball's skin, as an equirectangular map.
 *
 * Latitude runs down the canvas, longitude across it, so a horizontal band is a
 * stripe around the ball's equator and a circle at u = 0.25 / 0.75 lands on
 * opposite sides — which is exactly where the numbers belong.
 */
export function ballTexture(number: number): THREE.CanvasTexture {
  const cached = textureCache.get(number);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  const hue = ballHue(number);
  const isStripe = number > 8;
  const isCue = number === 0;

  if (isStripe) {
    // White ball with a colour band around the middle.
    ctx.fillStyle = '#f2ece0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hue;
    ctx.fillRect(0, h * 0.26, w, h * 0.48);
  } else {
    ctx.fillStyle = hue;
    ctx.fillRect(0, 0, w, h);
  }

  if (!isCue) {
    // The number, in its white disc, on both poles of the equator.
    for (const u of [0.25, 0.75]) {
      const cx = u * w;
      const cy = h / 2;
      const radius = h * 0.19;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f6f1e6';
      ctx.fill();

      ctx.fillStyle = '#17191a';
      ctx.font = `600 ${Math.round(radius * 1.25)}px "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Nudged down a touch: optical centring, not metric centring.
      ctx.fillText(String(number), cx, cy + radius * 0.06);
    }
  } else {
    // A single red spot, as most cue balls carry.
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, h * 0.055, 0, Math.PI * 2);
    ctx.fillStyle = '#b4272c';
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set(number, texture);
  return texture;
}

let clothTextures: { map: THREE.CanvasTexture; rough: THREE.CanvasTexture } | null = null;

/**
 * Baize. A woven weft plus fine noise, which under a low grazing light is what
 * stops the cloth reading as flat green plastic.
 */
export function clothTexture(): { map: THREE.CanvasTexture; rough: THREE.CanvasTexture } {
  if (clothTextures) return clothTextures;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#126b45';
  ctx.fillRect(0, 0, size, size);

  // Weave: alternating single-pixel threads in both directions.
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < size; i += 3) {
    ctx.fillStyle = i % 6 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }
  ctx.globalAlpha = 1;

  // Fine grain on top of the weave.
  const grain = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 4);
  map.anisotropy = 8;

  // The same pattern drives roughness so the weave catches the lamp.
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;
  rctx.drawImage(canvas, 0, 0);
  rctx.globalCompositeOperation = 'saturation';
  rctx.fillStyle = '#808080';
  rctx.fillRect(0, 0, size, size);

  const rough = new THREE.CanvasTexture(roughCanvas);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(8, 4);

  clothTextures = { map, rough };
  return clothTextures;
}

let woodTexture: THREE.CanvasTexture | null = null;

/** Dark walnut for the rails: stacked grain lines with a slow waver. */
export function railTexture(): THREE.CanvasTexture {
  if (woodTexture) return woodTexture;

  const w = 1024;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#30201a');
  base.addColorStop(0.5, '#452e22');
  base.addColorStop(1, '#241710');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 70; i += 1) {
    const y = Math.random() * h;
    const amplitude = 2 + Math.random() * 6;
    const period = 180 + Math.random() * 420;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 8) {
      ctx.lineTo(x, y + Math.sin((x / period) * Math.PI * 2) * amplitude);
    }
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(190,150,110,0.07)';
    ctx.lineWidth = 0.6 + Math.random() * 1.6;
    ctx.stroke();
  }

  woodTexture = new THREE.CanvasTexture(canvas);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.anisotropy = 8;
  return woodTexture;
}
