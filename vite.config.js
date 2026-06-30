import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuración de Vite para React + compatibilidad con Electron
export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'assets',
  server: {
    port: 5173,
    // Proxy hacia el servidor Express local
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
