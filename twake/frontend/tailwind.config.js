const defaultTheme = require('tailwindcss/defaultTheme');

let shades = [];
['zink', 'red', 'orange', 'green', 'blue'].map(color => {
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => {
    shades.push(`bg-${color}-${shade}`);
    shades.push(`border-${color}-${shade}`);
    shades.push(`text-${color}-${shade}`);
    shades.push(`dark:bg-${color}-${shade}`);
    shades.push(`dark:border-${color}-${shade}`);
    shades.push(`dark:text-${color}-${shade}`);
  });
});

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
        lg: '14px',
        md: '10px',
        sm: '8px',
      },
      fontSize: {
        lg: '17px',
        base: '15px',
        sm: '13px',
        xs: '11px',
      },
    },
  },
  safelist: ['h-8', 'bg-green-500', 'bg-red-500', 'bg-orange-500', ...shades],
  plugins: [require('@tailwindcss/forms')],
};
