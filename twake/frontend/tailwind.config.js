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
  //darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xxl: '24px',
        xl: '18px',
        lg: '16px',
        md: '10px',
        sm: '8px',
      },
      fontSize: {
        lg: '17px',
        base: '15px',
        sm: '13px',
        xs: '11px',
      },

      colors: {
        zinc: {
          50: '#f7f8f9', //From figma
          100: '#f2f4f5', //From figma
          200: '#ebedf0', //From figma
          300: '#d9dadb', //From figma
          400: '#b8c1cc', //From figma
          500: '#818c99', //From figma
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        blue: {
          100: '#DEEEFF', //From figma
          500: '#007AFF', //From figma
        },
      },
    },
  },
  safelist: [
    'max-w-md',
    'cursor-pointer',
    'w-32',
    'h-32',
    'w-16',
    'h-16',
    'w-14',
    'h-14',
    'w-12',
    'h-12',
    'h-8',
    'w-8',
    'bg-green-500',
    'bg-red-500',
    'bg-orange-500',
    'h-12',
    'px-4',
    'flex',
    'items-center',
    'border-b-2',
    'border-transparent',
    'zinc-100',
    'hover:text-blue-700',
    'active:text-blue-800',
    'text-blue-500',
    'max-w-xs',
    'sm:max-w-lg',
    ...shades,
  ],
  plugins: [require('@tailwindcss/forms')],
};
