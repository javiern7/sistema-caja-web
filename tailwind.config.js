/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#0f766e',
          600: '#115e59',
          700: '#134e4a',
        },
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, rgba(240,253,250,0.85), rgba(238,242,255,0.95))',
        'auth-gradient': 'linear-gradient(135deg, #0f172a 0%, #134e4a 48%, #1d4ed8 100%)',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
