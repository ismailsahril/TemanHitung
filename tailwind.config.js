/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          muted80: 'var(--color-ink-muted80)',
        },
        canvas: {
          DEFAULT: 'var(--color-canvas)',
          parchment: 'var(--color-canvas-parchment)',
        },
        tile: {
          1: 'var(--color-tile-1)',
          2: 'var(--color-tile-2)',
          3: 'var(--color-tile-3)',
        },
        correct: 'var(--color-correct)',
        wrong:   'var(--color-wrong)',
        tip:     'var(--color-tip)',
        surface: 'var(--color-surface)',
      },
      fontFamily: {
        sans: ['SF Pro Text', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
