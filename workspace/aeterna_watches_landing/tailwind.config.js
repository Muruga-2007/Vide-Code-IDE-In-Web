/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: '#0A0A0A', // Deep charcoal/almost black for backgrounds
        secondary: '#F5F5DC', // Cream/beige for contrasting elements or light backgrounds
        accent: '#B8860B', // Dark goldenrod for highlights, buttons, or key elements
        
        // Text colors
        'text-light': '#E0E0E0', // Light grey for text on dark backgrounds
        'text-dark': '#333333', // Dark grey for text on light backgrounds
        
        // Neutral shades
        'neutral-800': '#1A1A1A',
        'neutral-700': '#2C2C2C',
        'neutral-200': '#D4D4D4',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'], // Elegant serif for titles and headings
        body: ['Inter', 'sans-serif'], // Clean sans-serif for body text and UI elements
        // Add more custom fonts if needed, e.g., for specific cinematic effects
        // cinematic: ['"Cinematic Font Name"', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      // Custom animations for cinematic effects
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Add more custom keyframes as needed for scroll-based animations
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}