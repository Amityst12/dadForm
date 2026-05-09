import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1e3264',
        navyDark: '#162551',
      },
      fontFamily: {
        hebrew: ['David', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
