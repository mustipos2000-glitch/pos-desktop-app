/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  safelist: [
    'bg-orange-500',
    'bg-blue-500',
    'bg-green-500',
  ],
  theme: {
    extend: {
      colors: {
        // Primary dark theme colors based on existing CSS
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Custom POS colors - POSPOINT Theme (Dark Mode)
        pos: {
          // Main backgrounds - Dark
          'bg-primary': '#263544',
          'bg-secondary': '#445b71',
          'bg-tertiary': '#344963',
          'bg-quaternary': '#1b2836',
          'bg-accent': '#1b2430',

          // Borders and dividers - Dark
          'border-primary': '#a3aebc',
          'border-secondary': '#3b4f66',
          'border-accent': '#ffffff',
          'border-light': '#2a3544',

          // Text colors - Dark
          'text-primary': '#f5f5f7',
          'text-secondary': '#e5e7eb',
          'text-muted': '#cbd5f5',
          'text-disabled': '#8b92b0',

          // Interactive elements - Dark
          'interactive-primary': '#445b71',
          'interactive-hover': '#5a7189',
          'interactive-active': '#3b4f66',
          'interactive-border': 'rgba(255,255,255,0.35)',
          'interactive-border-hover': '#ffffff',

          // Status colors (same for both themes)
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444',
          'info': '#3b82f6',
        },
        // Light theme colors
        'pos-light': {
          // Main backgrounds - Light
          'bg-primary': '#f5f7fa',
          'bg-secondary': '#ffffff',
          'bg-tertiary': '#e8ecf1',
          'bg-quaternary': '#e5e9ef',
          'bg-accent': '#f0f3f7',

          // Borders and dividers - Light
          'border-primary': '#cbd5e1',
          'border-secondary': '#e5e9ef',
          'border-accent': '#64748b',
          'border-light': '#f0f3f7',

          // Text colors - Light
          'text-primary': '#1e293b',
          'text-secondary': '#334155',
          'text-muted': '#64748b',
          'text-disabled': '#94a3b8',

          // Interactive elements - Light
          'interactive-primary': '#e8ecf1',
          'interactive-hover': '#d1d9e3',
          'interactive-active': '#b8c4d4',
          'interactive-border': 'rgba(0,0,0,0.15)',
          'interactive-border-hover': '#64748b',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'xs': '10px',
        'sm': '11px',
        'base': '13px',
        'lg': '14px',
        'xl': '16px',
        '2xl': '18px',
      },
      spacing: {
        '18': '4.5rem',
      }
    },
  },
  plugins: [],
}