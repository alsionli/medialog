import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.VITE_TMDB_API_KEY

  const proxy = apiKey
    ? {
        '/api/tmdb-search': {
          target: 'https://api.themoviedb.org',
          changeOrigin: true,
          rewrite: () => '/3/search/multi',
          configure: (proxy: any) => {
            proxy.on('proxyReq', (proxyReq: any, req: any) => {
              const url = new URL(req.url || '/', 'http://localhost')
              const q = url.searchParams.get('q')
              proxyReq.path = `/3/search/multi?api_key=${apiKey}&include_adult=false${q ? `&query=${encodeURIComponent(q)}` : ''}`
            })
          },
        },
        '/api/tmdb-trending': {
          target: 'https://api.themoviedb.org',
          changeOrigin: true,
          rewrite: () => `/3/trending/all/week?api_key=${apiKey}`,
        },
        '/api/tmdb-details': {
          target: 'https://api.themoviedb.org',
          changeOrigin: true,
          configure: (proxy: any) => {
            proxy.on('proxyReq', (proxyReq: any, req: any) => {
              const url = new URL(req.url || '/', 'http://localhost')
              const type = url.searchParams.get('type') || 'movie'
              const id = url.searchParams.get('id') || ''
              proxyReq.path = `/3/${type}/${id}?api_key=${apiKey}`
            })
          },
        },
      }
    : undefined

  return {
    plugins: [react()],
    server: { proxy },
  }
})
