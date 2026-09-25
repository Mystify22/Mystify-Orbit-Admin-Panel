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
      // Audio & Theme Prompt endpoints live on question-ms (must be before the generic /v1 rule)
      '/v1/admin/save-audio': {
        target: 'https://question-ms.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: { Origin: 'https://question-ms.onrender.com' },
      },
      '/v1/admin/save-theme-prompt': {
        target: 'https://question-ms-imao.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: { Origin: 'https://question-ms-imao.onrender.com' },
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
