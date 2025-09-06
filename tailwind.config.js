/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Pro-Terminal palette
        ink:   '#0B1220',
        panel: '#0F172A',
        line:  '#1F2937',
        text:  '#E5E7EB',
        mute:  '#9CA3AF',
        // neon accents
        neon:  {
          blue:  '#22D5EE',
          violet:'#285CF6',
          pink:  '#F472B6',
          green: '#10B981',
          red:   '#F43F5E'
        }
      },
      boxShadow: {
        glass: '0 8px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)',
        glow:  '0 0 0 1px rgba(34,213,238,.35), 0 6px 32px rgba(34,213,238,.25)'
      },
      borderRadius: {
        xl2: '1rem'
      },
      keyframes: {
        'aurora': {
          '0%,100%': { transform: 'translateX(-10%)' },
          '50%':     { transform: 'translateX(10%)' }
        },
        'pulse-soft': {
          '0%,100%': { opacity: .85 },
          '50%':     { opacity: 1 }
        }
      },
      animation: {
        aurora: 'aurora 18s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.6s ease-in-out infinite'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'Segoe UI', 'Arial']
      }
    }
  },
  plugins: []
}