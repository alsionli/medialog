function isAllowedUrl(url) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    return (
      host === 'covers.openlibrary.org' ||
      host === 'image.tmdb.org' ||
      host.endsWith('.mzstatic.com') ||
      host === 'mzstatic.com'
    )
  } catch {
    return false
  }
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function looksLikeImageContentType(ct) {
  if (!ct) return true
  const lower = ct.toLowerCase()
  if (lower.includes('text/html')) return false
  if (lower.startsWith('image/')) return true
  if (lower.includes('application/octet-stream')) return true
  return false
}

/** OL sometimes sends odd types; verify actual bytes. */
function sniffImageMimeFixed(buffer) {
  const u8 = new Uint8Array(buffer.byteLength >= 12 ? buffer.slice(0, 12) : buffer)
  if (u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return 'image/jpeg'
  if (u8.length >= 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return 'image/png'
  if (u8.length >= 4 && u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46) return 'image/gif'
  if (
    u8.length >= 12 &&
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x45 &&
    u8[10] === 0x42 &&
    u8[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

/** Alternate OL cover sizes when -M is missing (common for some ISBNs). */
function openLibraryCoverFallbackUrls(url) {
  try {
    const u = new URL(url)
    if (u.hostname.toLowerCase() !== 'covers.openlibrary.org') return [url]
    const path = u.pathname
    if (!/\/b\/(id|isbn)\/.+-(S|M|L)\.jpg$/i.test(path)) return [url]
    const base = path.replace(/-(S|M|L)\.jpg$/i, '')
    const sizes = ['M', 'S', 'L']
    return sizes.map((s) => {
      const clone = new URL(u)
      clone.pathname = `${base}-${s}.jpg`
      return clone.toString()
    })
  } catch {
    return [url]
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawUrl = req.query.url || req.query.u
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  let targetUrl
  try {
    targetUrl = decodeURIComponent(rawUrl)
  } catch {
    return res.status(400).json({ error: 'Invalid url parameter' })
  }

  if (!isAllowedUrl(targetUrl)) {
    return res.status(403).json({ error: 'URL not allowed' })
  }

  const parsed = new URL(targetUrl)
  const host = parsed.hostname.toLowerCase()
  const isMzstatic = host.endsWith('.mzstatic.com') || host === 'mzstatic.com'
  const isOpenLibrary = host === 'covers.openlibrary.org'

  const baseHeaders = {
    'User-Agent': BROWSER_UA,
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  }
  if (isMzstatic) {
    baseHeaders.Referer = 'https://music.apple.com/'
  }
  if (isOpenLibrary) {
    baseHeaders.Referer = 'https://openlibrary.org/'
  }
  if (host === 'image.tmdb.org') {
    baseHeaders.Referer = 'https://www.themoviedb.org/'
  }

  const tryUrls = isOpenLibrary ? openLibraryCoverFallbackUrls(targetUrl) : [targetUrl]

  try {
    let lastError = 'Image fetch failed'

    for (const tryUrl of tryUrls) {
      if (!isAllowedUrl(tryUrl)) continue

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(tryUrl, {
        headers: baseHeaders,
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timeout)

      if (!response.ok) {
        lastError = `Image fetch failed: ${response.status}`
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      const buffer = await response.arrayBuffer()

      if (contentType.toLowerCase().includes('text/html')) {
        lastError = 'Upstream returned HTML'
        continue
      }

      let outType = null
      if (looksLikeImageContentType(contentType)) {
        outType = contentType.startsWith('image/')
          ? contentType.split(';')[0].trim()
          : 'image/jpeg'
      } else {
        const sniffed = sniffImageMimeFixed(buffer)
        if (sniffed) {
          outType = sniffed
        } else {
          lastError = 'Upstream did not return an image'
          continue
        }
      }

      res.setHeader('Content-Type', outType)
      res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800')
      res.send(Buffer.from(buffer))
      return
    }

    return res.status(502).json({ error: lastError })
  } catch (err) {
    res.status(502).json({ error: err.message || 'Image proxy error' })
  }
}
