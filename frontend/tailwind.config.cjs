const colors = require('tailwindcss/colors');

module.exports = {
  purge: [
    './frontend/**/*.jsx',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: colors.white,
      black: colors.black,
      primary: colors.lime,
      secondary: colors.orange,
      gray: colors.warmGray,
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
