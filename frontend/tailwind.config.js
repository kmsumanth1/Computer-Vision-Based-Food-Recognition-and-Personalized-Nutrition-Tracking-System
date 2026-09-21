/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        canvas: '#F5F7F4',
        line: '#E2E8E4',
        ink: {
          DEFAULT: '#10231C',
          soft: '#3F534B',
          mute: '#6B7F76',
        },
        pine: {
          50: '#EAF5F0',
          100: '#D2EBDF',
          200: '#A6D6BF',
          300: '#72BB9C',
          400: '#3F9C7A',
          500: '#1F805F',
          600: '#0F6B53',
          700: '#0B5643',
          800: '#094536',
          900: '#072F26',
        },
        volt: {
          DEFAULT: '#CDF564',
          soft: '#EAFBB8',
        },
        protein: { DEFAULT: '#E5484D', soft: '#FDECEC' },
        carbs: { DEFAULT: '#E99A0C', soft: '#FDF3DC' },
        fat: { DEFAULT: '#5B6CF0', soft: '#ECEEFE' },
        water: { DEFAULT: '#1E9BD1', soft: '#E3F4FB' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,35,28,0.05), 0 10px 28px -14px rgba(16,35,28,0.14)',
        pop: '0 20px 50px -18px rgba(16,35,28,0.35)',
      },
      keyframes: {
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scan-sweep': {
          '0%': { transform: 'translateY(0%)', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'tick-pulse': {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '1' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'modal-in': 'modal-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'tick-pulse': 'tick-pulse 1.9s ease-in-out infinite',
        'scan-sweep': 'scan-sweep 2.4s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
