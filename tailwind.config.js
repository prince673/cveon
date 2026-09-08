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
          bg:    '#0a0c10',
          bg2:   '#0d1015',
          bg3:   '#12151c',
          card:  '#141822',
          card2: '#1a1f2a',
          border:'#232a36',
        },
        accent: {
          cyan:   '#5b8def',
          purple: '#7b83d4',
          amber:  '#d9a03f',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease both',
        'spin-slow': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}