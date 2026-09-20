import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1/auth': {
        target: 'https://auth-ms-r7eg.onrender.com',
        changeOrigin: true,
        secure: false,
        // Spoof Origin so the backend's whitelist accepts local dev requests
        headers: { Origin: 'https://auth-ms-r7eg.onrender.com' },
      },
      '/v1': {
        target: 'https://user-ms-rko7.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: { Origin: 'https://user-ms-rko7.onrender.com' },
      },
      '/internal': {
        target: 'https://user-ms-rko7.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: { Origin: 'https://user-ms-rko7.onrender.com' },
      },
      '/user-health-check': {
        target: 'https://user-ms-rko7.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: { Origin: 'https://user-ms-rko7.onrender.com' },
      },
    },
  },
})
