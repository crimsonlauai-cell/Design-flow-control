/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1e3a8a',
          dark: '#0f172a',
          light: '#eff6ff'
        },
        status: {
          green: '#10b981',
          orange: '#f59e0b',
          red: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
