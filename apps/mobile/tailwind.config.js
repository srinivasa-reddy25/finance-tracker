/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.js', './App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        income: '#16A34A',
        expense: '#DC2626',
        surface: '#F8FAFC',
        border: '#E2E8F0',
      },
    },
  },
  plugins: [],
};
