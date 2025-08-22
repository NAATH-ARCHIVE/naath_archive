/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'naath-bronze': '#8B4513', // Brown/Bronze color
        'naath-blue': '#00008B',   // Dark Blue color
        'naath-bronze-light': '#A0522D',
        'naath-bronze-dark': '#654321',
        'naath-blue-light': '#0000CD',
        'naath-blue-dark': '#000080',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'naath': '0 4px 6px -1px rgba(139, 69, 19, 0.1), 0 2px 4px -1px rgba(0, 0, 139, 0.06)',
        'naath-lg': '0 10px 15px -3px rgba(139, 69, 19, 0.1), 0 4px 6px -2px rgba(0, 0, 139, 0.05)',
      },
      backgroundImage: {
        'gradient-naath': 'linear-gradient(135deg, #8B4513 0%, #00008B 100%)',
        'gradient-naath-reverse': 'linear-gradient(135deg, #00008B 0%, #8B4513 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
