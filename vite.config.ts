import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://user-ms-rko7.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/internal': {
        target: 'https://user-ms-rko7.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/user-health-check': {
        target: 'https://user-ms-rko7.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

