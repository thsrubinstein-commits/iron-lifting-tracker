import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, paper-like surfaces with a quiet rust accent.
        cream: {
          50: '#faf7f1',
          100: '#f3ede0',
          200: '#e8dfcc',
          300: '#d6c8ab',
        },
        ink: {
          900: '#1a1612',
          800: '#26201a',
          700: '#3a3128',
          600: '#5a4d40',
          500: '#7a6d5e',
          400: '#9c8f7e',
          300: '#bdb09e',
        },
        rust: {
          50: '#fbf1ec',
          100: '#f0d4c5',
          400: '#d27a55',
          500: '#c45a36',
          600: '#a84826',
          700: '#86381c',
        },
      },
      fontFamily: {
        sans: ['"General Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"General Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        widest: '0.18em',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(26 22 18 / 0.04), 0 1px 0 rgb(26 22 18 / 0.02)',
      },
    },
  },
  plugins: [],
} satisfies Config;
