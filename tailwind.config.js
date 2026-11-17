/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        editorial: ['"Instrument Serif"', 'serif'],
      },
      colors: {
        darkBg: '#0C0C0C',
        textLight: '#D7E2EA',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
        '6xl': '50px',
        '7xl': '60px',
      }
    },
  },
  plugins: [],
}
