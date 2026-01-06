/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        jabil: {
          blue: '#1a4f9c',
          red: '#e31b23',
        }
      },
      borderRadius: {
        'xl': '0.5rem',
        '2xl': '0.75rem',
      }
    },
  },
  plugins: [],
}
