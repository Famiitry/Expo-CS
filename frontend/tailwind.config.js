/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0f766e",
        energy: "#f5b301",
        critical: "#dc2626"
      }
    }
  },
  plugins: []
};
