/**
 * In production (Vercel), external cover images may be blocked by referrer/CORS.
 * Use our API proxy to fetch them server-side.
 *
 * Skip the proxy on localhost so `vite preview` and local static tests still load
 * images directly (there is no /api/image-proxy in that setup).
 */
function shouldUseImageProxy(): boolean {
  if (!import.meta.env.PROD) return false
  if (typeof window === 'undefined') return true
  const h = window.location.hostname
  return h !== 'localhost' && h !== '127.0.0.1'
}

export function getCoverUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  if (!shouldUseImageProxy()) return url

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const allowed =
      host === 'covers.openlibrary.org' ||
      host === 'image.tmdb.org' ||
      host.endsWith('.mzstatic.com') ||
      host === 'mzstatic.com'
    if (!allowed) return url
  } catch {
    return url
  }

  // Same-origin proxy: works when the user’s network blocks hotlinking to OL / TMDB / Apple CDN.
  const proxied = `/api/image-proxy?url=${encodeURIComponent(url)}`
  // #region agent log
  const g = globalThis as { __dbgOlCoverLog?: number }
  if (url.includes('covers.openlibrary.org')) {
    g.__dbgOlCoverLog = (g.__dbgOlCoverLog ?? 0) + 1
    if (g.__dbgOlCoverLog > 4) {
      return proxied
    }
    fetch('http://127.0.0.1:7637/ingest/18c82ce6-7609-44aa-abeb-d6f8949b468e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cef54f' },
      body: JSON.stringify({
        sessionId: 'cef54f',
        location: 'cover.ts:getCoverUrl',
        message: 'OL cover URL transform',
        data: {
          prod: import.meta.env.PROD,
          useProxy: true,
          originalHost: (() => {
            try {
              return new URL(url).hostname
            } catch {
              return 'invalid'
            }
          })(),
          proxiedLen: proxied.length,
        },
        timestamp: Date.now(),
        hypothesisId: 'C',
        runId: 'pre-fix',
      }),
    }).catch(() => {})
  }
  // #endregion
  return proxied
}
