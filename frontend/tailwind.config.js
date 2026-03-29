/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'; // 👈 Add this import

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Crimson Text"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        stone: {
          50: '#f9f8f6',
          900: '#1c1917',
        }
      }
    },
  },
  plugins: [
    typography, // 👈 Add the plugin here
  ],
}