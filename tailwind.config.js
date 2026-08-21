/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        p66: {
          amber: '#F5A623',
          red: '#C8102E',
          dark: '#1f2937',
          darker: '#111827',
        }
      }
    },
  },
  plugins: [],
}
