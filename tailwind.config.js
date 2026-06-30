/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta institucional del Tribunal de Cuentas
        institucional: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1e3a5f',   // Azul marino principal
          600: '#1a3254',
          700: '#152a47',
          800: '#0f1f35',
          900: '#0a1525',
        },
        estado: {
          visado:     '#FFFFFF',
          pendiente:  '#FEF9C3',
          observado:  '#FEE2E2',
          en_proceso: '#DCFCE7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
