/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
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

