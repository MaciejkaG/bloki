/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/**/*.{html,js}",
    "./html/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        "theme-bg": "var(--theme-bg)",
        "theme-fg": "var(--theme-fg)",
        "theme-alt": "var(--theme-alt-bg)",
      },
    },
    fontFamily: {
      'logo': ['Poppins', 'sans-serif'],
      'header': ['Montserrat', 'sans-serif'],
      'main': ['Nunito', 'sans-serif']
    }
  },
  plugins: [],
}