import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  plugins: [
    tailwindcssAnimate,
  ],
};
