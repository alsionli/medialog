import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.VITE_TMDB_API_KEY

  const OL_FIELDS = 'key,title,author_name,first_publish_year,cover_i,isbn,subject'

  const openLibraryProxy = {
    '/api/openlibrary': {
      target: 'https://openlibrary.org',
      changeOrigin: true,
      configure: (proxy: any) => {
        proxy.on('proxyReq', (proxyReq: any, req: any) => {
          const url = new URL(req.url || '/', 'http://localhost')
          const action = url.searchParams.get('action') || 'trending'
          const q = url.searchParams.get('q') || ''
          if (action === 'search') {
            proxyReq.path = `/search.json?q=${encodeURIComponent(q)}&limit=8&fields=${OL_FIELDS}`
          } else {
            proxyReq.path = `/search.json?q=fiction&sort=new&limit=8&fields=${OL_FIELDS}`
          }
        })
      },
    },
  }

  const tmdbProxy = apiKey
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
    : {}

  const proxy = { ...openLibraryProxy, ...tmdbProxy } as Record<string, ProxyOptions>

  return {
    plugins: [react()],
    server: { proxy },
  }
})
