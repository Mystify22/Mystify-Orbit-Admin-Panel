import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(() => {
  // Read base microservice URLs from .env (single source of truth)
  const env = loadEnv('', process.cwd(), 'VITE_')

  const authUrl = env.VITE_AUTH_MS_URL || 'https://auth-ms-y7b6.onrender.com'
  const questionUrl = env.VITE_QUESTION_MS_URL || 'https://question-ms-imao.onrender.com'
  const userUrl = env.VITE_USER_MS_URL || 'https://user-ms-k4i3.onrender.com'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/v1/auth': {
          target: authUrl,
          changeOrigin: true,
          secure: false,
          // Spoof Origin so the backend's whitelist accepts local dev requests
          headers: { Origin: authUrl },
        },
        // Audio & Theme Prompt endpoints live on question-ms (must be before the generic /v1 rule)
        '/v1/admin/save-audio': {
          target: questionUrl,
          changeOrigin: true,
          secure: false,
          headers: { Origin: questionUrl },
        },
        '/v1/admin/save-theme-prompt': {
          target: questionUrl,
          changeOrigin: true,
          secure: false,
          headers: { Origin: questionUrl },
        },
        '/v1/admin/generate-theme': {
          target: questionUrl,
          changeOrigin: true,
          secure: false,
          headers: { Origin: questionUrl },
        },
        '/v1': {
          target: userUrl,
          changeOrigin: true,
          secure: false,
          headers: { Origin: userUrl },
        },
        '/internal': {
          target: userUrl,
          changeOrigin: true,
          secure: false,
          headers: { Origin: userUrl },
        },
        '/user-health-check': {
          target: userUrl,
          changeOrigin: true,
          secure: false,
          headers: { Origin: userUrl },
        },
      },
    },
  }
})
