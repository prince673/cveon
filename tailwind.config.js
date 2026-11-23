/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        dark: {
          bg:    '#0d1117',
          bg2:   '#161b22',
          bg3:   '#1c2128',
          card:  '#161b22',
          card2: '#21262d',
          border:'#30363d',
        },
        accent: {
          // Single restrained accent for interactive states. Severity/priority
          // colors stay semantic and are applied near data, not on chrome.
          indigo: '#58a6ff',
          cyan:   '#58a6ff',
          purple: '#58a6ff',
          amber:  '#d29922',
          pink:   '#58a6ff',
        },
      },
      boxShadow: {
        // Kept as no-ops so legacy hover:* classes in components stay valid
        // without reintroducing glow effects.
        glow:        '0 0 #0000',
        'glow-soft': '0 0 #0000',
        'glow-red':  '0 0 #0000',
        'glow-amber':'0 0 #0000',
        'glow-green':'0 0 #0000',
        lift:        '0 0 #0000',
        glass:       '0 0 #0000',
      },
      animation: {
        'fade-up':   'fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in':   'fadeIn 0.25s ease both',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        'view-in':   'viewIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-slow': 'spin 1.2s linear infinite',
        'spin-med':  'spin 2s linear infinite',
        'spin-fast': 'spin 0.7s linear infinite',
        shimmer:     'shimmer 1.8s linear infinite',
        drift:       'drift 26s ease-in-out infinite alternate',
        'drift-slow':'drift 38s ease-in-out infinite alternate-reverse',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        sweep:       'sweep 2.4s ease-in-out infinite',
        'glow-breathe': 'glowBreathe 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        viewIn: {
          from: { opacity: 0, transform: 'translateY(14px) scale(0.995)' },
          to:   { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        drift: {
          '0%':   { transform: 'translate(0, 0) scale(1)' },
          '50%':  { transform: 'translate(60px, -40px) scale(1.15)' },
          '100%': { transform: 'translate(-40px, 50px) scale(0.95)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%':      { opacity: 0.45, transform: 'scale(0.8)' },
        },
        sweep: {
          '0%':   { transform: 'translateX(-100%)' },
          '60%, 100%': { transform: 'translateX(220%)' },
        },
        glowBreathe: {
          '0%, 100%': { opacity: 0.55 },
          '50%':      { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
