import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Parmore brand palette
        parmore: {
          black:   '#0a0a0a',
          white:   '#fafafa',
          cream:   '#f5f0e8',
          gold:    '#c9a84c',
          'gold-light': '#e2c97e',
          navy:    '#1e3a5f',
          'navy-light': '#2a4f80',
          slate:   '#6b7280',
          'slate-light': '#9ca3af',
          green:   '#2d4a2d',
        },
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        mono:  ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'slide-in': 'slideIn 0.4s ease forwards',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'luxury': '0 4px 30px rgba(0, 0, 0, 0.08)',
        'luxury-lg': '0 8px 60px rgba(0, 0, 0, 0.12)',
        'inset-gold': 'inset 0 0 0 1px #c9a84c',
      },
    },
  },
  plugins: [],
};

export default config;
