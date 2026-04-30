/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fff4f0',
          100: '#ffe1d5',
          400: '#ff8a65',
          500: '#ff6b3d',
          600: '#f5532a',
          700: '#d43f1e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(15, 23, 42, 0.18)'
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.5)', opacity: 0 },
          '50%': { transform: 'scale(1.15)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        }
      },
      animation: {
        pop: 'pop 0.6s ease-out'
      }
    }
  },
  plugins: []
};
