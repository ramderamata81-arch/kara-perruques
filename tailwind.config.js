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
          light: '#faf5ff', // purple-50
          DEFAULT: '#9333ea', // purple-600
          dark: '#581c87', // purple-900
          gold: '#d4af37',
        }
      }
    },
  },
  plugins: [],
}
