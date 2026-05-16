/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F'
        },
        ink: {
          50:  '#FAF8F4',
          100: '#F0EBE0',
          200: '#DCD3C0',
          300: '#B8AB91',
          400: '#867A60',
          500: '#5C5240',
          600: '#473F31',
          700: '#3F362A',
          800: '#262119',
          900: '#15110C'
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(217, 119, 6, 0.35)',
        glow: '0 0 24px -4px rgba(251, 191, 36, 0.45)'
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pop': 'pop 0.25s ease-out',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pop: {
          '0%':   { transform: 'scale(0.92)' },
          '60%':  { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' }
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
