/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        bgDark: '#060B15',
        surface: '#0F172A',
        glassSurface: 'rgba(18, 25, 42, 0.75)',
        sidebarBg: '#09101E',
        cardBg: '#131D30',
        primary: {
          DEFAULT: '#5B8CFF',
          hover: '#4878ee',
        },
        electric: '#00E5FF',
        purple: {
          DEFAULT: '#7C3AED',
        },
        success: '#00FFB2',
        warning: '#FBBF24',
        danger: '#FF4D6D',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        borderGlass: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glass-panel': '0 20px 50px rgba(0, 0, 0, 0.6)',
        'glow-primary': '0 0 30px -5px rgba(91, 140, 255, 0.45)',
        'glow-electric': '0 0 30px -5px rgba(0, 229, 255, 0.45)',
        'glow-purple': '0 0 30px -5px rgba(124, 58, 237, 0.45)',
        'glow-danger': '0 0 30px -5px rgba(255, 77, 109, 0.45)',
        'glow-success': '0 0 30px -5px rgba(0, 255, 178, 0.45)',
      },
      animation: {
        'spin-slow': 'spin 18s linear infinite',
        'spin-reverse': 'spin-reverse 24s linear infinite',
        'pulse-core': 'pulse-core 3s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'pulse-core': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.08)', opacity: '0.6' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
