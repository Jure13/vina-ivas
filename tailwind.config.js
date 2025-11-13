module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: "#520e05",
      },
      fontFamily: {
        hero: ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
};