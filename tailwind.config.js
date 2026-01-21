/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
       colors: {
        primary: '#6366F1', // Indigo
        secondary: '#0F172A', // Deep Navy (Background)
        card: '#111827', // Card Background
        success: '#22C55E', // Green
        warning: '#FACC15', // Yellow
        danger: '#EF4444', // Red
        pending: '#FB923C', // Orange
      }
    },
  },
  plugins: [],
}
