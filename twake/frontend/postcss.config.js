// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    require('postcss-100vh-fix'),
  },
};
