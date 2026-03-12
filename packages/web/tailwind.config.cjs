/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background-rgb))',
        foreground: 'rgb(var(--foreground-rgb))',
        accent: { DEFAULT: '#4e79a7', hover: '#3f6489' },
        danger: { DEFAULT: '#e15759', hover: '#c74a4c' },
      },
      borderColor: {
        foreground: 'rgb(var(--foreground-rgb))',
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('light', '.light &');
      addVariant('high-contrast', '.high-contrast &');
    },
  ],
};
