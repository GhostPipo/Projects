/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f0f11',
        darkSurface: '#18181b',
        accentPurple: '#8b5cf6',
        accentGreen: '#10b981',
        errorRed: '#ef4444'
      }
    },
  },
  plugins: [],
}
