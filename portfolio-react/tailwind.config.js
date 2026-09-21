/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2bee79",
        pgreen: "#5cff5c",
        paper: "#f3e6cf",
        paperdeep: "#e9d5b3",
        ink: "#1e1630",
        night: "#0b0d1f",
        chalk: "#e8ecff",
        blush: "#c8473f",
        "background-light": "#f3e6cf",
        "background-dark": "#0b0d1f",
        "surface-dark": "#162e21",
        "surface-light": "#fffdf7",
      },
      fontFamily: {
        display: ["Spline Sans", "sans-serif"],
        hand: ['Caveat', '"Bradley Hand"', '"Segoe Script"', 'cursive'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
