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
        // B2B Design System
        navy: '#0A192F',
        sky: '#38BDF8',
        lime: '#DEFF9A',
        'b2b-surface': '#F6F9FD',
        'b2b-border': '#E3EBF5',
        'b2b-body': '#55637A',
        'b2b-heading': '#0F1E34',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        arimo: ['Arimo', 'Arial', 'sans-serif'],
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
