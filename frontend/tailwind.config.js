/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'; // <-- 1. ADD THIS IMPORT

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // 2. ADD THIS 'colors' SECTION
      colors: {
        blue: colors.red,
        purple: colors.red,
        indigo: colors.red,
      },
    },
  },
  plugins: [],
}