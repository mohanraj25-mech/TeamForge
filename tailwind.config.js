export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bbd8ff',
          300: '#8ab9ff',
          400: '#5f96ff',
          500: '#4677ff',
          600: '#3055d9',
          700: '#2a49b3',
          800: '#273d8f',
          900: '#25396f',
        },
      },
    },
  },
  plugins: [],
};
