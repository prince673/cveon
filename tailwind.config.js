/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        dark: {
          bg:    '#070614',
          bg2:   '#0b0a1e',
          bg3:   '#110f28',
          card:  '#131232',
          card2: '#191745',
          border:'#2a2752',
        },
        accent: {
          indigo: '#818cf8',
          cyan:   '#22d3ee',
          purple: '#a78bfa',
          amber:  '#fbbf24',
          pink:   '#f472b6',
        },
      },
      boxShadow: {
        glow:         '0 0 0 1px rgba(129,140,248,0.35), 0 8px 32px -8px rgba(129,140,248,0.55)',
        'glow-soft':  '0 4px 24px -6px rgba(129,140,248,0.40)',
        'glow-red':   '0 0 0 1px rgba(244,63,94,0.35), 0 8px 32px -8px rgba(244,63,94,0.45)',
        'glow-amber': '0 0 0 1px rgba(251,191,36,0.30), 0 8px 32px -8px rgba(251,191,36,0.40)',
        'glow-green': '0 0 0 1px rgba(52,211,153,0.30), 0 8px 32px -8px rgba(52,211,153,0.40)',
        lift:         '0 12px 48px -12px rgba(0,0,0,0.8)',
        glass:        '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.09)',
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
        drift:        'drift 26s ease-in-out infinite alternate',
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
        drift: {
          '0%':   { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%':  { transform: 'translate3d(-48px, 36px, 0) scale(1.08)' },
          '100%': { transform: 'translate3d(36px, -24px, 0) scale(0.97)' },
        },
      },
    },
  },
  plugins: [],
}