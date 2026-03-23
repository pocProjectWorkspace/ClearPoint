import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy / slate palette
        navy: {
          50: '#f0f2f7',
          100: '#d9dde8',
          200: '#b3bbcf',
          300: '#8d99b6',
          400: '#67779d',
          500: '#415584',
          600: '#34446a',
          700: '#273350',
          800: '#1a2236',
          900: '#0d111c',
          950: '#070a10',
        },
        // Warm white
        warm: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf3e7',
          300: '#f5e8d4',
          400: '#eedcc0',
        },
        // Accent — amber
        accent: {
          50: '#fff9eb',
          100: '#ffefc6',
          200: '#ffdf88',
          300: '#ffcc4a',
          400: '#ffb820',
          500: '#f99607',
          600: '#dd6f02',
          700: '#b74d06',
          800: '#943b0c',
          900: '#7a310d',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-md': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.5rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
      },
      maxWidth: {
        content: '72rem',
        narrow: '48rem',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config
