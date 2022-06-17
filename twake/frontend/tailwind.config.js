const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./src/**/*.{html,js,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xl: '24px',
        lg: '16px',
        md: '10px',
      },
      fontSize: {
        lg: '17px',
        base: '15px',
        sm: '13px',
        xs: '11px',
      },
    },
  },
  safelist: ['bg-green-500', 'bg-red-500', 'bg-orange-500'],
  plugins: [require('@tailwindcss/forms')],
};
