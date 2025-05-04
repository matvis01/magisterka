// /** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["dark", "light", "retro", "dim", "cupcake", "winter", "cyberpunk", "forest", "halloween", "garden", "lofi", "dracula", "business", "night", "fantasy", "valentine", "synthwave"],
  },
}
