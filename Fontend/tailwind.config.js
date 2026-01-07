/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'xs': '14px',      // Minimum size
        'sm': '14px',      // Small (minimum)
        'base': '15px',    // Default size
        'lg': '16px',
        'xl': '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '30px',
        '5xl': '36px',
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.form-input': {
          '@apply w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-colors': {},
        },
        '.form-input-error': {
          '@apply border-red-300 focus:ring-red-500': {},
        },
        '.form-input-disabled': {
          '@apply bg-slate-100 cursor-not-allowed': {},
        },
        '.form-label': {
          '@apply block text-sm font-medium text-slate-700 mb-1': {},
        },
        '.form-label-required': {
          '@apply text-red-500 ml-1': {},
        },
        '.form-error-text': {
          '@apply mt-1 text-xs text-red-600': {},
        }
      })
    }
  ],
}

