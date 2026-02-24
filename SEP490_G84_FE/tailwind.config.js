// tailwind.config.js
import forms from '@tailwindcss/forms'; // Thay vì require

/** @type {import('tailwindcss').Config} */
export default { // Thay vì module.exports
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          DEFAULT: '#5a6e4b',
          dark: '#4b5d3f',
        },
        gold: {
          DEFAULT: '#c1a67a',
          dark: '#af9160',
        }
      },
    },
  },
  plugins: [
    forms, // Sử dụng biến đã import ở trên
  ],
}