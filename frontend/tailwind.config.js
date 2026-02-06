import { clubTheme } from './src/config/theme.ts'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: clubTheme.primary,
        dark: clubTheme.dark,
        accent: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
        'glow-primary': `0 0 20px ${clubTheme.primary[400]}40, 0 0 40px ${clubTheme.primary[400]}20`,
        'glow-accent': '0 0 20px rgba(232, 232, 232, 0.15)',
      },
      backgroundImage: {
        'dark-gradient': `linear-gradient(135deg, ${clubTheme.dark[900]} 0%, ${clubTheme.dark[800]} 50%, ${clubTheme.dark[900]} 100%)`,
        'score-gradient': `linear-gradient(135deg, ${clubTheme.primary[600]} 0%, ${clubTheme.primary[400]} 100%)`,
        'header-gradient': `linear-gradient(90deg, ${clubTheme.primary[400]}15 0%, transparent 100%)`,
        'field-pattern': 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}
