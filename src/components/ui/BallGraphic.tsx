/**
 * A billiard ball drawn in SVG.
 *
 * The hero owns the only WebGL canvas on the site. Everything below it that
 * needs a ball gets one of these instead: resolution-independent, a few
 * hundred bytes, no GPU, and it renders identically on a phone that would
 * rather not be running a second 3D scene.
 */

const HUES: Record<number, [string, string, string]> = {
  // [highlight, body, shadow]
  0: ['#ffffff', '#efe9dc', '#9d978b'],
  1: ['#f6d57a', '#d9a21b', '#7d5b08'],
  2: ['#6f9fe0', '#1b4f9c', '#0d2550'],
  3: ['#e8787c', '#b4272c', '#5e1215'],
  4: ['#a479cc', '#55297d', '#2c1342'],
  5: ['#f0a568', '#d1661b', '#6f3208'],
  6: ['#5bbd8e', '#17704a', '#0a3a26'],
  7: ['#c06a70', '#762c32', '#3c1316'],
  8: ['#55595a', '#101313', '#000000'],
};

export function BallGraphic({
  number = 8,
  className,
  title,
}: {
  number?: number;
  className?: string;
  title?: string;
}) {
  const base = number > 8 ? number - 8 : number;
  const [highlight, body, shadow] = HUES[base] ?? HUES[8];
  const stripe = number > 8;
  const uid = `ball-${number}`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* Light from upper-left, as the table lamp would give it. */}
        <radialGradient id={`${uid}-body`} cx="34%" cy="27%" r="82%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="38%" stopColor={body} />
          <stop offset="100%" stopColor={shadow} />
        </radialGradient>
        <radialGradient id={`${uid}-white`} cx="34%" cy="27%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#f1ebdd" />
          <stop offset="100%" stopColor="#a49d90" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="56" fill={`url(#${uid}-${stripe ? 'white' : 'body'})`} />

      {stripe && (
        <g clipPath={`url(#${uid}-clip)`}>
          {/* The band, bowed to follow the curve of the ball. */}
          <path d="M0 32 Q60 18 120 32 L120 88 Q60 102 0 88 Z" fill={`url(#${uid}-body)`} />
        </g>
      )}

      {number > 0 && (
        <>
          <circle cx="60" cy="60" r="21" fill="#f7f2e7" />
          <text
            x="60"
            y="61.5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-display), sans-serif"
            fontSize="26"
            fontWeight="700"
            fill="#15181a"
          >
            {number}
          </text>
        </>
      )}

      {/* Specular highlight — the single detail that makes it read as resin. */}
      <ellipse cx="40" cy="31" rx="14" ry="9" fill="#ffffff" opacity="0.52" transform="rotate(-30 40 31)" />
      <ellipse cx="34" cy="26" rx="5" ry="3.2" fill="#ffffff" opacity="0.85" transform="rotate(-30 34 26)" />

      {/* Contact shading at the base. */}
      <circle cx="60" cy="60" r="56" fill="none" stroke="#000000" strokeOpacity="0.32" strokeWidth="2" />
    </svg>
  );
}
