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
          50:  '#f5f5f7', // Parchment
          100: '#fafafc', // Pearl
          400: '#2997ff', // Sky Link Blue
          500: '#0066cc', // Action Blue
          600: '#0066cc', // Action Blue
          700: '#0071e3', // Focus Blue
        },
        ink: {
          DEFAULT: '#1d1d1f', // Near-Black Ink
          muted: '#7a7a7a',
          muted80: '#333333',
        },
        canvas: {
          DEFAULT: '#ffffff',
          parchment: '#f5f5f7',
        },
        tile: {
          1: '#272729',
          2: '#2a2a2c',
          3: '#252527',
        },
        correct: '#16a34a',
        wrong:   '#dc2626',
        tip:     '#d97706',
        surface: '#f5f5f7',
      },
      fontFamily: {
        sans: ['SF Pro Text', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
