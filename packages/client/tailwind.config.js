/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
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
        // Custom POS colors based on existing design
        pos: {
          // Main backgrounds
          'bg-primary': '#1a1d2e',    // Main background
          'bg-secondary': '#252a3f',   // Secondary background
          'bg-tertiary': '#2d3348',    // Card backgrounds
          'bg-quaternary': '#1e2139',  // Order panel background
          'bg-accent': '#1e2332',      // Sub-products section
          
          // Borders and dividers
          'border-primary': '#2d3348',
          'border-secondary': '#3d4461',
          'border-accent': '#3f4765',
          'border-light': '#2a2e47',
          
          // Text colors
          'text-primary': '#ffffff',
          'text-secondary': '#e5e7eb',
          'text-muted': '#8b92b0',
          'text-disabled': '#6b7280',
          
          // Interactive elements
          'interactive-primary': '#3d4461',
          'interactive-hover': '#4a5170',
          'interactive-active': '#5a6282',
          
          // Status colors
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444',
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