import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api':    { target: 'http://127.0.0.1:5050', timeout: 300_000, changeOrigin: true },
      '/uploads':{ target: 'http://127.0.0.1:5050', timeout: 300_000, changeOrigin: true },
    },
  },
})
