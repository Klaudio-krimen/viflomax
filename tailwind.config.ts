import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    // Note: proyecto no usa directorio src/
  ],
  theme: {
    extend: {
      colors: {
        viflomax: {
          'verde': '#6ab04c',
          'verde-claro': '#7ec850',
          'azul': '#4db8e8',
          'azul-oscuro': '#1a6ba0',
        }
      },
      fontFamily: {
        nunito: ['var(--font-nunito)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

export default config
