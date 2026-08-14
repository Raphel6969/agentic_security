/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#07090E',
          card: '#0B0F19',
          border: 'rgba(255, 255, 255, 0.08)',
          crimson: '#FF2E55',
          emerald: '#00F5A0',
          amber: '#FFB800',
          indigo: '#6366F1',
          cyan: '#00D2FF',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
