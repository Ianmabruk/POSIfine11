export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0EA5E9',
        secondary: '#38BDF8',
        accent: '#7DD3FC',
        dark: '#0F172A',
        light: '#F8FAFC'
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.7s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
}