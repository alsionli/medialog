import { fallbackSuggestions } from '../data/seed'
import type { MediaCategory, MediaSuggestion } from '../types/media'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
/** OL / TMDB can exceed 8s on slow networks; aborting caused empty UI before fallback applied. */
const FETCH_TIMEOUT_MS = 25000
const isProd = import.meta.env.PROD

/** TMDB screen search/trending requires a Vite env key in dev and deployment env in prod. */
export function isTmdbConfigured(): boolean {
  return Boolean(TMDB_API_KEY)
}

function normalizeOpenLibraryTitle(title: unknown): string {
  if (typeof title === 'string') return title
  if (Array.isArray(title) && title.length > 0 && typeof title[0] === 'string') {
    return title[0]
  }
  return 'Untitled'
}

function openLibraryApiUrl(action: 'search' | 'trending', q?: string): string {
  if (action === 'search') {
    return `/api/openlibrary?action=search&q=${encodeURIComponent(q ?? '')}`
  }
  return '/api/openlibrary?action=trending'
}

function upscaleItunesArtwork(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (url.includes('100x100bb')) return url.replace(/100x100bb/g, '600x600bb')
  return url
}

/** Normalize OL `isbn` field (string, number, or array) and strip hyphens. */
function normalizeOpenLibraryIsbns(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).replace(/-/g, '')).filter(Boolean)
  }
  return [String(raw).replace(/-/g, '')].filter(Boolean)
}

/** Prefer 13-digit 978… ISBN when present. Use `-M` (not `-L`) — `-L` often 404s for ISBN endpoint. */
function openLibraryCoverUrl(cover_i: number | undefined, isbnRaw: unknown): string | undefined {
  if (cover_i) {
    return `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg`
  }
  const isbns = normalizeOpenLibraryIsbns(isbnRaw)
  const preferred =
    isbns.find((i) => i.startsWith('978') && i.length >= 13) ??
    isbns.find((i) => i.startsWith('978')) ??
    isbns[0]
  if (!preferred) return undefined
  return `https://covers.openlibrary.org/b/isbn/${preferred}-M.jpg`
}

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeout)
  }
}

function mapTmdbPoster(path?: string | null) {
  return path ? `${TMDB_IMAGE_BASE}${path}` : undefined
}

const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
}

function mapGenreIds(ids?: number[]): string[] {
  if (!ids?.length) return []
  return ids
    .map((id) => TMDB_GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, 3)
}

function hasCoverArt(item: MediaSuggestion): boolean {
  return Boolean(item.coverUrl?.trim())
}

/** Prefer API hits that have posters/art; pad with fallbacks so Trending picks are never coverless. */
function ensureTrendingWithCovers(
  items: MediaSuggestion[],
  fallback: MediaSuggestion[],
  max = 8,
): MediaSuggestion[] {
  const out: MediaSuggestion[] = []
  const seen = new Set<string>()
  for (const item of items) {
    if (!hasCoverArt(item)) continue
    if (seen.has(item.id)) continue
    out.push(item)
    seen.add(item.id)
    if (out.length >= max) return out
  }
  for (const item of fallback) {
    if (!hasCoverArt(item)) continue
    if (seen.has(item.id)) continue
    out.push(item)
    seen.add(item.id)
    if (out.length >= max) break
  }
  return out
}

async function fetchScreenTrending(): Promise<MediaSuggestion[]> {
  if (!TMDB_API_KEY) {
    return fallbackSuggestions.screen
  }

  const response = await fetchWithTimeout('/api/tmdb-trending')

  if (!response.ok) {
    throw new Error('Failed to fetch TMDB trending titles.')
  }

  const data = (await response.json()) as {
    results: Array<{
      id: number
      media_type: 'movie' | 'tv' | 'person'
      poster_path?: string | null
      title?: string
      name?: string
      release_date?: string
      first_air_date?: string
      overview?: string
      genre_ids?: number[]
    }>
  }

  const mapped = data.results
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    .slice(0, 40)
    .map((item) => ({
      id: `tmdb-${item.id}`,
      category: 'screen',
      title: item.title ?? item.name ?? 'Untitled',
      creator: item.media_type === 'tv' ? 'TV series' : 'Film',
      releaseDate: item.release_date ?? item.first_air_date,
      coverUrl: mapTmdbPoster(item.poster_path),
      source: 'tmdb',
      sourceLabel: 'TMDB weekly trending',
      sourceUrl: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
      tags: mapGenreIds(item.genre_ids),
      duration: 2,
    }))
  const ensured = ensureTrendingWithCovers(mapped as MediaSuggestion[], fallbackSuggestions.screen, 8)
  return (ensured.length > 0 ? ensured : fallbackSuggestions.screen) as MediaSuggestion[]
}

async function fetchBookTrending(): Promise<MediaSuggestion[]> {
  const response = await fetchWithTimeout(openLibraryApiUrl('trending'))

  if (!response.ok) {
    throw new Error('Failed to fetch Open Library books.')
  }

  const data = (await response.json()) as {
    docs?: Array<{
      key: string
      title: string | string[]
      author_name?: string[]
      first_publish_year?: number
      cover_i?: number
      isbn?: string[]
      subject?: string[]
    }>
  }

  const docs = Array.isArray(data.docs) ? data.docs : []

  // #region agent log
  fetch('http://127.0.0.1:7637/ingest/18c82ce6-7609-44aa-abeb-d6f8949b468e', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cef54f' },
    body: JSON.stringify({
      sessionId: 'cef54f',
      location: 'trending.ts:fetchBookTrending',
      message: 'OL trending docs received',
      data: {
        docsLen: docs.length,
        sample: docs.slice(0, 3).map((d) => ({
          key: d.key,
          cover_i: d.cover_i,
          isbn0: Array.isArray(d.isbn) ? d.isbn[0] : null,
        })),
      },
      timestamp: Date.now(),
      hypothesisId: 'A',
      runId: 'pre-fix',
    }),
  }).catch(() => {})
  // #endregion

  const mapped = docs.map((item, index) => {
    const coverUrl = openLibraryCoverUrl(item.cover_i, item.isbn)
    const tags = item.subject?.slice(0, 3) ?? []
    const key = item.key ?? `/works/unknown-${index}`
    return {
      id: key,
      category: 'book',
      title: normalizeOpenLibraryTitle(item.title),
      creator: item.author_name?.[0] ?? 'Unknown author',
      releaseDate: item.first_publish_year ? String(item.first_publish_year) : undefined,
      coverUrl,
      source: 'openlibrary',
      sourceLabel: 'Open Library trending',
      sourceUrl: `https://openlibrary.org${key}`,
      tags,
      duration: 300,
    }
  })
  const ensured = ensureTrendingWithCovers(mapped as MediaSuggestion[], fallbackSuggestions.book, 8)

  // #region agent log
  const mappedWithCover = mapped.filter((m) => Boolean(m.coverUrl?.trim())).length
  fetch('http://127.0.0.1:7637/ingest/18c82ce6-7609-44aa-abeb-d6f8949b468e', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cef54f' },
    body: JSON.stringify({
      sessionId: 'cef54f',
      location: 'trending.ts:fetchBookTrending',
      message: 'book trending after ensure',
      data: {
        mappedWithCover,
        mappedLen: mapped.length,
        ensuredLen: ensured.length,
        firstCoverPrefix: ensured[0]?.coverUrl?.slice(0, 96) ?? null,
        usedFallbackOnly: ensured.length === 0,
      },
      timestamp: Date.now(),
      hypothesisId: 'B',
      runId: 'pre-fix',
    }),
  }).catch(() => {})
  // #endregion

  return (ensured.length > 0 ? ensured : fallbackSuggestions.book) as MediaSuggestion[]
}

async function fetchAlbumTrending(): Promise<MediaSuggestion[]> {
  const url = isProd ? '/api/apple-music' : 'https://rss.marketingtools.apple.com/api/v2/us/music/most-played/12/albums.json'
  const response = await fetchWithTimeout(url)

  if (!response.ok) {
    throw new Error('Failed to fetch Apple Music charts.')
  }

  const data = (await response.json()) as {
    feed: {
      results: Array<{
        id: string
        name: string
        artistName: string
        releaseDate: string
        artworkUrl100?: string
        url?: string
        genres?: Array<{ name: string }>
      }>
    }
  }

  const mapped = data.feed.results.map((item) => {
    const tags = item.genres?.map((g) => g.name).slice(0, 3) ?? []
    return {
      id: item.id,
      category: 'album',
      title: item.name,
      creator: item.artistName,
      releaseDate: item.releaseDate,
      coverUrl: upscaleItunesArtwork(item.artworkUrl100),
      source: 'apple-music',
      sourceLabel: 'Apple Music most played',
      sourceUrl: item.url,
      tags,
      duration: 0.5,
    }
  })
  const ensured = ensureTrendingWithCovers(mapped as MediaSuggestion[], fallbackSuggestions.album, 8)
  return (ensured.length > 0 ? ensured : fallbackSuggestions.album) as MediaSuggestion[]
}

export async function fetchTrendingByCategory(
  category: MediaCategory,
): Promise<MediaSuggestion[]> {
  try {
    if (category === 'screen') {
      return await fetchScreenTrending()
    }

    if (category === 'book') {
      return await fetchBookTrending()
    }

    return await fetchAlbumTrending()
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7637/ingest/18c82ce6-7609-44aa-abeb-d6f8949b468e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cef54f' },
      body: JSON.stringify({
        sessionId: 'cef54f',
        location: 'trending.ts:fetchTrendingByCategory',
        message: 'trending fetch threw',
        data: { category, err: String(err) },
        timestamp: Date.now(),
        hypothesisId: 'E',
        runId: 'pre-fix',
      }),
    }).catch(() => {})
    // #endregion
    return fallbackSuggestions[category]
  }
}

export async function searchByCategory(
  category: MediaCategory,
  query: string,
): Promise<MediaSuggestion[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  try {
    if (category === 'screen') {
      return await searchScreen(trimmed)
    }

    if (category === 'book') {
      return await searchBook(trimmed)
    }

    return await searchAlbum(trimmed)
  } catch {
    return []
  }
}

async function searchScreen(query: string): Promise<MediaSuggestion[]> {
  if (!TMDB_API_KEY) return []

  const response = await fetchWithTimeout(
    `/api/tmdb-search?q=${encodeURIComponent(query)}`,
  )

  if (!response.ok) return []

  const data = (await response.json()) as {
    results: Array<{
      id: number
      media_type: 'movie' | 'tv' | 'person'
      poster_path?: string | null
      title?: string
      name?: string
      release_date?: string
      first_air_date?: string
      genre_ids?: number[]
    }>
  }

  return data.results
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    .slice(0, 8)
    .map((item) => ({
      id: `tmdb-${item.id}`,
      category: 'screen' as const,
      title: item.title ?? item.name ?? 'Untitled',
      creator: item.media_type === 'tv' ? 'TV series' : 'Film',
      releaseDate: item.release_date ?? item.first_air_date,
      coverUrl: mapTmdbPoster(item.poster_path),
      source: 'tmdb' as const,
      sourceLabel: 'TMDB search',
      sourceUrl: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
      tags: mapGenreIds(item.genre_ids),
      duration: 2,
    }))
}

async function searchBook(query: string): Promise<MediaSuggestion[]> {
  const response = await fetchWithTimeout(openLibraryApiUrl('search', query))

  if (!response.ok) return []

  const data = (await response.json()) as {
    docs?: Array<{
      key: string
      title: string | string[]
      author_name?: string[]
      first_publish_year?: number
      cover_i?: number
      isbn?: string[]
      subject?: string[]
    }>
  }

  const docs = Array.isArray(data.docs) ? data.docs : []

  return docs.map((item, index) => {
    const coverUrl = openLibraryCoverUrl(item.cover_i, item.isbn)
    const tags = item.subject?.slice(0, 3) ?? []
    const key = item.key ?? `/works/unknown-${index}`
    return {
      id: key,
      category: 'book' as const,
      title: normalizeOpenLibraryTitle(item.title),
      creator: item.author_name?.[0] ?? 'Unknown author',
      releaseDate: item.first_publish_year ? String(item.first_publish_year) : undefined,
      coverUrl,
      source: 'openlibrary' as const,
      sourceLabel: 'Open Library search',
      sourceUrl: `https://openlibrary.org${key}`,
      tags,
      duration: 300,
    }
  })
}

async function searchAlbum(query: string): Promise<MediaSuggestion[]> {
  const response = await fetchWithTimeout(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=8`,
  )

  if (!response.ok) return []

  const data = (await response.json()) as {
    results: Array<{
      collectionId: number
      collectionName: string
      artistName: string
      releaseDate: string
      artworkUrl100?: string
      artworkUrl600?: string
      collectionViewUrl?: string
      primaryGenreName?: string
    }>
  }

  return data.results.map((item) => {
    const tags = item.primaryGenreName ? [item.primaryGenreName] : []
    return {
      id: `itunes-${item.collectionId}`,
      category: 'album' as const,
      title: item.collectionName,
      creator: item.artistName,
      releaseDate: item.releaseDate,
      coverUrl: item.artworkUrl600 ?? upscaleItunesArtwork(item.artworkUrl100),
      source: 'apple-music' as const,
      sourceLabel: 'iTunes search',
      sourceUrl: item.collectionViewUrl,
      tags,
      duration: 0.5,
    }
  })
}
