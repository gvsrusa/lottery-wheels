/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 20px 45px -12px rgba(56, 189, 248, 0.35)',
      },
      colors: {
        ink: {
          50: '#f4f8ff',
          100: '#dbe5ff',
          200: '#b3c6ff',
          300: '#8ca8ff',
          400: '#6589ff',
          500: '#3d6bff',
          600: '#2f54db',
          700: '#233cad',
          800: '#16247f',
          900: '#0a0f51',
        },
      },
    },
  },
  plugins: [],
}
