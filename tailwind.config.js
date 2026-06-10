/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        fire: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        steel: {
          50: '#F5F8FA',
          100: '#E9EEF3',
          200: '#D3DEE8',
          300: '#AFC2D4',
          400: '#7FA0BC',
          500: '#5A81A2',
          600: '#466887',
          700: '#39546E',
          800: '#32475B',
          900: '#1E3A5F',
          950: '#0F2238',
        },
        hazard: {
          critical: '#DC2626',
          major: '#EA580C',
          general: '#CA8A04',
          minor: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['"Source Han Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 8px -4px rgb(0 0 0 / 0.06)',
        'elevated': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
      },
      backgroundImage: {
        'gradient-fire': 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        'gradient-steel': 'linear-gradient(135deg, #1E3A5F 0%, #39546E 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #2563EB 0%, #1E3A5F 100%)',
        'gradient-forest': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
