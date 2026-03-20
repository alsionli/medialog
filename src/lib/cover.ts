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
    // Open Library covers allow normal <img> hotlinking; server-side proxy often fails (502)
    // from Vercel → browser decodes JSON error as image. Load directly.
    if (host === 'covers.openlibrary.org') {
      return url
    }
    const allowed =
      host === 'image.tmdb.org' ||
      host.endsWith('.mzstatic.com') ||
      host === 'mzstatic.com'
    if (!allowed) return url
  } catch {
    return url
  }

  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}
