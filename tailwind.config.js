/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0c14",
        surface: "#12151f",
        raised: "#1a1e2e",
        gold: "#f5c842",
        rpurple: "#7c3aed",
        teal: "#0d9488",
      },
    },
  },
  plugins: [],
};
