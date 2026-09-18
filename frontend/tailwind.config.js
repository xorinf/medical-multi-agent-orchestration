/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFCF9',
          100: '#FAF8F5',
          200: '#F4EFEA',
          300: '#EAE2D8',
          400: '#DBD0C3',
        },
        cream: {
          50: '#FDFBF7',
          100: '#F8F5EE',
          200: '#F0EADF',
          300: '#E5DDCF',
          400: '#D5C9B7',
        },
        sage: {
          50: '#F4F7F5',
          100: '#EAF0EB',
          200: '#D6E3D8',
          300: '#BACFC0',
          400: '#8FB098',
          500: '#648E72',
          600: '#4D7359',
          700: '#3D5B46',
          800: '#324A3A',
          900: '#273B2E',
        },
        charcoal: {
          50: '#F6F7F6',
          100: '#E7E9E8',
          200: '#CFD3D1',
          300: '#AAB0AC',
          400: '#7F8781',
          500: '#5C635E',
          600: '#434A45',
          700: '#323733',
          800: '#232724',
          900: '#181B19',
          950: '#0E110F',
        },
        alert: {
          warning: '#B8772E',
          danger: '#B53E3E',
          success: '#3F7A5E',
          info: '#4B6B64',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(24, 27, 25, 0.04), 0 1px 4px -1px rgba(24, 27, 25, 0.02)',
        'medium': '0 8px 24px -4px rgba(24, 27, 25, 0.06), 0 4px 12px -2px rgba(24, 27, 25, 0.03)',
        'elevated': '0 20px 32px -8px rgba(24, 27, 25, 0.09), 0 8px 16px -4px rgba(24, 27, 25, 0.04)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
