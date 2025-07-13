/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neon Tech on Black theme
        primary: {
          DEFAULT: '#39ff14',
          soft: '#83ff8e',
          dark: '#2dd60e',
        },
        background: {
          DEFAULT: '#0d0d0d',
          card: '#1a1a1a',
          muted: '#262626',
        },
        text: {
          DEFAULT: '#ffffff',
          muted: '#c4c4c4',
          accent: '#39ff14',
        },
        border: {
          DEFAULT: '#39ff14',
          muted: '#83ff8e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      fontSize: {
        'display': ['24px', { lineHeight: '1', fontWeight: '600' }],
        'h1': ['16px', { lineHeight: '1.2', fontWeight: '700' }],
        'body': ['10px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        '4pt': '4px',
        '16pt': '16px',
        '24px': '24px',
      },
      borderRadius: {
        'neon': '4px',
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 15px #39ff14',
          },
          '50%': {
            boxShadow: '0 0 2px #39ff14, 0 0 5px #39ff14, 0 0 8px #39ff14',
          },
        },
        'glow': {
          'from': {
            textShadow: '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 15px #39ff14',
          },
          'to': {
            textShadow: '0 0 10px #39ff14, 0 0 20px #39ff14, 0 0 30px #39ff14',
          },
        },
      },
    },
  },
  plugins: [],
}