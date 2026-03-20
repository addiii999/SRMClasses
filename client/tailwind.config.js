/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9787F3',
          50:  '#F4F2FD',
          100: '#E8E4FB',
          200: '#D1C9F7',
          300: '#BAACF3',
          400: '#A395F0',
          500: '#9787F3',
          600: '#7B69E8',
          700: '#5F4BDD',
          800: '#4433C2',
          900: '#2D274B',
        },
        brand: {
          bg: '#EAEFFE',
          dark: '#2D274B',
          purple: '#9787F3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #9787F3 0%, #7B69E8 100%)',
        'gradient-hero': 'linear-gradient(135deg, #2D274B 0%, #4433C2 50%, #9787F3 100%)',
        'gradient-light': 'linear-gradient(135deg, #EAEFFE 0%, #F4F2FD 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(151, 135, 243, 0.15)',
        'glass-lg': '0 16px 48px 0 rgba(151, 135, 243, 0.2)',
        'card': '0 4px 24px rgba(45, 39, 75, 0.08)',
        'card-hover': '0 12px 40px rgba(45, 39, 75, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
      },
    },
  },
  plugins: [],
}
