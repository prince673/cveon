/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        dark: {
          bg:    '#07090e',
          bg2:   '#0b0e15',
          bg3:   '#10141c',
          card:  '#111520',
          card2: '#161b26',
          border:'#1e2635',
        },
        accent: {
          cyan:   '#5b8def',
          purple: '#7b83d4',
          amber:  '#d9a03f',
          pink:   '#e879a0',
        },
      },
      boxShadow: {
        glow:         '0 0 0 1px rgba(91,141,239,0.3), 0 8px 32px -8px rgba(91,141,239,0.5)',
        'glow-soft':  '0 4px 24px -6px rgba(91,141,239,0.35)',
        'glow-red':   '0 0 0 1px rgba(229,72,77,0.3), 0 8px 32px -8px rgba(229,72,77,0.4)',
        'glow-amber': '0 0 0 1px rgba(217,160,63,0.3), 0 8px 32px -8px rgba(217,160,63,0.4)',
        'glow-green': '0 0 0 1px rgba(48,164,108,0.3), 0 8px 32px -8px rgba(48,164,108,0.4)',
        lift:         '0 12px 48px -12px rgba(0,0,0,0.8)',
        glass:        '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.07)',
      },
      animation: {
        'fade-up':    'fadeUp 0.35s ease both',
        'fade-in':    'fadeIn 0.4s ease both',
        'scale-in':   'scaleIn 0.25s ease both',
        'spin-slow':  'spin 1.2s linear infinite',
        'spin-med':   'spin 2s linear infinite',
        'spin-fast':  'spin 0.7s linear infinite',
        shimmer:      'shimmer 1.8s linear infinite',
        float:        'float 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in':   'slideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'gradient-x': 'gradientX 4s ease infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.94)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px 2px rgba(229,72,77,0.3)' },
          '50%':      { boxShadow: '0 0 28px 6px rgba(229,72,77,0.55)' },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateX(-12px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}