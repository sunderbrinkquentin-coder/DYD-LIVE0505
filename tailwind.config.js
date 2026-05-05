/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4ECDC4',
        'primary-hover': '#3DB8AE',
        accent: '#FF6B6B',
        'dark-bg': '#0A1929',
        'dark-card': '#132F4C',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B2BAC2',
        success: '#4CAF50',
        warning: '#FFA726',
        error: '#EF5350',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
