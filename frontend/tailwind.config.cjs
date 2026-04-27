/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false, // Keep existing global.css reset intact
    container: false, // Keep existing .container class intact
  },
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#fff8f0',
          100: '#ffe8cc',
          200: '#ffd090',
          300: '#ffb74d',
          400: '#ff9a1a',
          500: '#FF7A00',
          600: '#e06500',
          700: '#c25000',
          800: '#8b3a00',
          900: '#4a1e00',
        },
        crimson: {
          50:  '#fff5f5',
          100: '#ffe4e4',
          700: '#C62828',
          800: '#B71C1C',
          900: '#7f0000',
        },
        gold: {
          300: '#FFE082',
          400: '#FFD740',
          500: '#FFC107',
          600: '#FFB300',
          700: '#D4AF37',
        },
        maroon: {
          700: '#8B2500',
          800: '#6a1800',
          900: '#3D1C00',
        },
      },
      fontFamily: {
        display:    ['Tiro Devanagari Marathi', 'serif'],
        devanagari: ['Noto Serif Devanagari', 'serif'],
      },
      animation: {
        'float':     'float 3.5s ease-in-out infinite',
        'spin-slow': 'spin 28s linear infinite',
        'shine':     'shine 3.5s linear infinite',
      },
      keyframes: {
        shine: {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      boxShadow: {
        saffron:    '0 8px 32px rgba(255,122,0,0.28)',
        'saffron-xl':'0 20px 60px rgba(255,122,0,0.38)',
        spiritual:  '0 12px 40px rgba(139,37,0,0.18)',
        glow:       '0 0 40px rgba(255,122,0,0.45), 0 0 80px rgba(255,122,0,0.15)',
      },
      backgroundImage: {
        'hero-warm':      'linear-gradient(118deg,#fffaf4 0%,#fff5e8 38%,#fde7c0 68%,#f8d380 100%)',
        'dot-pattern':    'radial-gradient(circle,rgba(224,123,42,0.12) 1.5px,transparent 1.5px)',
        'mantra-dark':    'linear-gradient(120deg,#2a0500 0%,#6a0e00 40%,#8b1a00 70%,#4a0800 100%)',
        'saffron-grad':   'linear-gradient(135deg,#FF7A00 0%,#c25000 100%)',
        'gold-shimmer':   'linear-gradient(105deg,transparent 40%,rgba(255,220,80,0.18) 50%,transparent 60%)',
      },
    },
  },
  plugins: [],
};
