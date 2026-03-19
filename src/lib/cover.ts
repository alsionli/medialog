/**
 * In production (Vercel), external cover images may be blocked by referrer/CORS.
 * Use our API proxy to fetch them server-side.
 */
export function getCoverUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  if (!import.meta.env.PROD) return url

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

  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}
