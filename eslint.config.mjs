import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Run directly by Node, outside the Next build.
    'scripts/**',
  ]),

  {
    /**
     * The 3D scene.
     *
     * React Compiler's immutability rule assumes everything happens inside
     * React's render cycle. React Three Fiber's does not: `useFrame` callbacks
     * are driven by the Three.js render loop, outside React entirely, and
     * mutating refs and object transforms there is the documented and only
     * sane way to animate — the alternative is re-rendering React sixty times
     * a second.
     *
     * Scoped to this directory on purpose. The rule stays on everywhere else.
     */
    files: ['src/components/table/**/*.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },

  {
    /**
     * `load()` is async — every setState in it runs in a promise
     * continuation, never synchronously during the effect. The rule flags the
     * call site without following the await.
     */
    files: ['src/components/sections/Availability.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  {
    /**
     * This project uses plain `<img>` throughout and no `next/image`.
     *
     * Two reasons. The asset pipeline (scripts/assets.mjs) has already
     * produced the sizes, the WebP and the blurred placeholder and emits a
     * `srcSet` for them, so there is nothing left to optimise. And the static
     * export needs relative `./…` paths to work when opened off the disk,
     * which `next/image` rejects — it insists on a leading slash.
     */
    files: ['src/**/*.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]);

export default eslintConfig;
