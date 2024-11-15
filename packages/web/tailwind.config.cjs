/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background-rgb))',
        foreground: 'rgb(var(--foreground-rgb))',
      },
      borderColor: {
        foreground: 'rgb(var(--foreground-rgb))',
      },
    },
  },
  variants: {
    extend: {
      // light: '.light &',
      // 'high-contrast': '.high-contrast &',
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('light', '.light &');
      addVariant('high-contrast', '.high-contrast &');
    },
  ],
};
