/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          bg: '#F4F8F5',
          card: '#FFFFFF',
          forest: '#14532D',
          teal: '#0F766E',
          emerald: '#16A34A',
          lime: '#A3E635',
          mint: '#ECFDF5',
          softgreen: '#DCFCE7',
          text: '#10251B',
          secondary: '#4B6354',
          muted: '#84988B',
          border: '#E2ECE5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'eco-sm': '0 2px 8px -2px rgba(16, 37, 27, 0.05), 0 1px 4px -1px rgba(16, 37, 27, 0.03)',
        'eco-md': '0 8px 24px -4px rgba(16, 37, 27, 0.08), 0 2px 8px -2px rgba(16, 37, 27, 0.04)',
        'eco-lg': '0 16px 36px -6px rgba(16, 37, 27, 0.12), 0 4px 12px -2px rgba(16, 37, 27, 0.06)',
        'eco-glow': '0 0 25px -5px rgba(22, 163, 74, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1.5s infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        scanLine: {
          '0%': { top: '0%' },
          '50%': { top: '95%' },
          '100%': { top: '0%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
