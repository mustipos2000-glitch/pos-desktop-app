/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // Custom POS colors - POSPOINT Theme
        pos: {
          // Main backgrounds
          'bg-primary': '#263544',      // Main background (from reference)
          'bg-secondary': '#445b71',    // Secondary background gradient
          'bg-tertiary': '#344963',     // Panel/Card backgrounds (from reference)
          'bg-quaternary': '#1b2836',   // Darker background variant
          'bg-accent': '#1b2430',       // Accent background

          // Borders and dividers
          'border-primary': '#a3aebc',  // Primary border (from reference)
          'border-secondary': '#3b4f66', // Secondary border
          'border-accent': '#ffffff',   // Accent border (white from reference)
          'border-light': '#2a3544',    // Light border variant

          // Text colors
          'text-primary': '#f5f5f7',    // Primary text (from reference)
          'text-secondary': '#e5e7eb',  // Secondary text
          'text-muted': '#cbd5f5',      // Muted text
          'text-disabled': '#8b92b0',   // Disabled text

          // Interactive elements (buttons, cards, etc.)
          'interactive-primary': '#445b71',     // Primary button/card (from reference)
          'interactive-hover': '#5a7189',       // Hover state (lighter)
          'interactive-active': '#3b4f66',      // Active/pressed state (darker)
          'interactive-border': 'rgba(255,255,255,0.35)', // Interactive border
          'interactive-border-hover': '#ffffff', // Hover border

          // Status colors
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444',          // Error/Danger (from reference)
          'info': '#3b82f6',
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