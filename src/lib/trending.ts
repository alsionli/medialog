import { fallbackSuggestions } from '../data/seed'
import type { MediaCategory, MediaSuggestion } from '../types/media'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
const FETCH_TIMEOUT_MS = 8000
const isProd = import.meta.env.PROD

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

  const items = data.results
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    .slice(0, 8)
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
  return (items.length > 0 ? items : fallbackSuggestions.screen) as MediaSuggestion[]
}

async function fetchBookTrending(): Promise<MediaSuggestion[]> {
  const url = isProd ? '/api/openlibrary?action=trending' : 'https://openlibrary.org/search.json?q=fiction&sort=new&limit=8&fields=key,title,author_name,first_publish_year,cover_i,isbn,subject'
  const response = await fetchWithTimeout(url)

  if (!response.ok) {
    throw new Error('Failed to fetch Open Library books.')
  }

  const data = (await response.json()) as {
    docs: Array<{
      key: string
      title: string
      author_name?: string[]
      first_publish_year?: number
      cover_i?: number
      isbn?: string[]
      subject?: string[]
    }>
  }

  const items = data.docs.map((item) => {
    let coverUrl: string | undefined
    if (item.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
    } else if (item.isbn?.[0]) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${item.isbn[0]}-M.jpg`
    }
    const tags = item.subject?.slice(0, 3) ?? []
    return {
      id: item.key,
      category: 'book',
      title: item.title,
      creator: item.author_name?.[0] ?? 'Unknown author',
      releaseDate: item.first_publish_year ? String(item.first_publish_year) : undefined,
      coverUrl,
      source: 'openlibrary',
      sourceLabel: 'Open Library trending',
      sourceUrl: `https://openlibrary.org${item.key}`,
      tags,
      duration: 300,
    }
  })
  return (items.length > 0 ? items : fallbackSuggestions.book) as MediaSuggestion[]
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

  const items = data.feed.results.map((item) => {
    const tags = item.genres?.map((g) => g.name).slice(0, 3) ?? []
    return {
      id: item.id,
      category: 'album',
      title: item.name,
      creator: item.artistName,
      releaseDate: item.releaseDate,
      coverUrl: item.artworkUrl100 ?? undefined,
      source: 'apple-music',
      sourceLabel: 'Apple Music most played',
      sourceUrl: item.url,
      tags,
      duration: 0.5,
    }
  })
  return (items.length > 0 ? items : fallbackSuggestions.album) as MediaSuggestion[]
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
  } catch {
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
  const url = isProd ? `/api/openlibrary?action=search&q=${encodeURIComponent(query)}` : `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,isbn,subject`
  const response = await fetchWithTimeout(url)

  if (!response.ok) return []

  const data = (await response.json()) as {
    docs: Array<{
      key: string
      title: string
      author_name?: string[]
      first_publish_year?: number
      cover_i?: number
      isbn?: string[]
      subject?: string[]
    }>
  }

  return data.docs.map((item) => {
    let coverUrl: string | undefined
    if (item.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
    } else if (item.isbn?.[0]) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${item.isbn[0]}-M.jpg`
    }
    const tags = item.subject?.slice(0, 3) ?? []
    return {
      id: item.key,
      category: 'book' as const,
      title: item.title,
      creator: item.author_name?.[0] ?? 'Unknown author',
      releaseDate: item.first_publish_year ? String(item.first_publish_year) : undefined,
      coverUrl,
      source: 'openlibrary' as const,
      sourceLabel: 'Open Library search',
      sourceUrl: `https://openlibrary.org${item.key}`,
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
      coverUrl: item.artworkUrl100 ?? undefined,
      source: 'apple-music' as const,
      sourceLabel: 'iTunes search',
      sourceUrl: item.collectionViewUrl,
      tags,
      duration: 0.5,
    }
  })
}
