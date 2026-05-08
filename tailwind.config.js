/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          green: '#22c55e',
          red: '#ef4444',
          glow: '#10b981',
          bg: '#05080a',
          panel: '#0b1014'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace']
      },
      keyframes: {
        jitter: {
          '0%, 100%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(-4px, 2px)' },
          '50%': { transform: 'translate(4px, -2px)' },
          '75%': { transform: 'translate(-2px, -4px)' }
        },
        errorFlash: {
          '0%, 100%': { color: '#22c55e', textShadow: 'none' },
          '50%': { color: '#ef4444', textShadow: '2px 2px 0px #7f1d1d, -2px -2px 0px #f87171' }
        },
        successPulse: {
          '0%, 100%': { color: '#22c55e', textShadow: 'none' },
          '50%': { color: '#ffffff', textShadow: '0 0 10px #10b981, 0 0 20px #10b981, 0 0 40px #22c55e' }
        },
        scanline: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100vh' }
        },
        cursorBlink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' }
        }
      },
      animation: {
        'glitch-error': 'jitter 0.15s linear infinite, errorFlash 0.3s linear infinite',
        'glitch-success': 'successPulse 0.5s ease-in-out 2',
        'scanline': 'scanline 6s linear infinite',
        'cursor-blink': 'cursorBlink 1s step-end infinite'
      }
    }
  },
  plugins: []
};
