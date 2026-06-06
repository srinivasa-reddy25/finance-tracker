/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.js', './App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: '#F4F2EC',
        surface: '#FFFFFF',
        surface2: '#FBFAF6',

        // Ink
        ink: '#1A1714',
        ink2: '#6B655C',
        ink3: '#9C968C',

        // Hairlines
        line: '#EAE6DD',
        line2: '#DCD7CB',

        // Accent — deep money green
        accent: '#0E7B53',
        'accent-press': '#0B6444',
        'accent-soft': '#E4F1EA',
        'accent-ink': '#FFFFFF',

        // Semantics
        income: '#0E7B53',
        'income-soft': '#E4F1EA',
        expense: '#C5392C',
        'expense-soft': '#FAEAE7',
        warn: '#B07514',
        'warn-soft': '#F7EFDC',

        // Categories
        'cat-food': '#DA8400',
        'cat-food-bg': '#FAF0DB',
        'cat-transport': '#2F6BE2',
        'cat-transport-bg': '#E8EFFD',
        'cat-entertain': '#7C5CFF',
        'cat-entertain-bg': '#EEEAFF',
        'cat-health': '#E0484D',
        'cat-health-bg': '#FBEAEB',
        'cat-shopping': '#D6308C',
        'cat-shopping-bg': '#FAE6F1',
        'cat-bills': '#0E9F8E',
        'cat-bills-bg': '#E0F4F1',
        'cat-others': '#7A746B',
        'cat-others-bg': '#EFEDE7',
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'System', 'sans-serif'],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '24px',
        '2xl': '30px',
      },
      spacing: {
        s1: '4px',
        s2: '8px',
        s3: '12px',
        s4: '16px',
        s5: '20px',
        s6: '24px',
        s8: '32px',
        s10: '40px',
      },
    },
  },
  plugins: [],
};
