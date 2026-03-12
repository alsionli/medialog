import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/tmdb': {
        target: 'https://api.themoviedb.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, '/3'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const apiKey = process.env.VITE_TMDB_API_KEY
            if (apiKey) {
              const sep = proxyReq.path?.includes('?') ? '&' : '?'
              proxyReq.path += `${sep}api_key=${apiKey}`
            }
          })
        },
      },
    },
  },
})
