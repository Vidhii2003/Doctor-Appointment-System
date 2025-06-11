/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      
      colors:{
        'primary':"#60A5FA"
      },
      gridTemplateColumns:{
        'auto':'repeat(auto-fill,minmax(150px, 1fr))'
      }
    },
  },
  plugins: [],
}