/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './public/dist/*.js'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#050510',
          soft: '#0a0a18',
          card: '#0e0e1f',
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#8b5cf6',
          indigo: '#6366f1',
        },
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.55)' },
          '70%': { boxShadow: '0 0 0 12px rgba(34, 211, 238, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0)' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-spin': 'border-spin 4s linear infinite',
      },
    },
  },
  plugins: [],
}
