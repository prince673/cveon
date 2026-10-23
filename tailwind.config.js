/** @type {import('tailwindcss').Config} */
export default {
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
        'fade-up':   'fadeIn 0.2s ease both',
        'fade-in':   'fadeIn 0.15s ease both',
        'scale-in':  'scaleIn 0.15s ease both',
        'spin-slow': 'spin 1.2s linear infinite',
        'spin-med':  'spin 2s linear infinite',
        'spin-fast': 'spin 0.7s linear infinite',
        shimmer:     'shimmer 1.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.98)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
