/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '2rem',
        lg: '2rem',
        xl: '2rem',
        '2xl': '2.5rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        ui: {
          border: '#1f2937',
          surface: '#111827',
          surfaceMuted: '#0b0f19',
          textMuted: '#9ca3af',
        },
        brand: {
          50: '#fff3e9',
          100: '#ffe1c5',
          200: '#ffc28a',
          300: '#ffa250',
          400: '#ff8d29',
          500: '#ff7a00',
          600: '#cc6200',
          700: '#a04e00',
          800: '#733800',
          900: '#452100',
        },
      },
      fontFamily: {
        sans: [
          'Inter var',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
      },
      boxShadow: {
        'brand-glow': '0 0 0 1px rgba(255, 122, 0, 0.35), 0 0 24px rgba(255, 122, 0, 0.12)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/container-queries'),
  ],
}


