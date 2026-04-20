/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          slate: {
            850: '#1e293b',
            900: '#0f172a',
            950: '#020617',
          },
          primary: {
            DEFAULT: '#3b82f6', // Blue 500
            foreground: '#ffffff',
          },
          accent: {
            DEFAULT: '#10b981', // Emerald 500
            foreground: '#ffffff',
          }
        }
      },
    },
    plugins: [],
  }