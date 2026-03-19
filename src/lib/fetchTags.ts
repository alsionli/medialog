import type { LogEntry } from '../types/media'

const FETCH_TIMEOUT_MS = 8000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchTmdbTags(sourceUrl: string): Promise<string[]> {
  const movieMatch = sourceUrl.match(/themoviedb\.org\/movie\/(\d+)/)
  const tvMatch = sourceUrl.match(/themoviedb\.org\/tv\/(\d+)/)
  const id = movieMatch?.[1] ?? tvMatch?.[1]
  const type = movieMatch ? 'movie' : 'tv'
  if (!id) return []

  const res = await fetchWithTimeout(`/api/tmdb-details?type=${type}&id=${id}`)
  if (!res.ok) return []

  const data = (await res.json()) as { genres?: Array<{ id: number; name: string }> }
  const genres = data.genres ?? []
  return genres.map((g) => g.name).slice(0, 3)
}

async function fetchOpenLibraryTags(sourceUrl: string): Promise<string[]> {
  const match = sourceUrl.match(/openlibrary\.org\/works\/(OL\d+W)/)
  const key = match?.[1]
  if (!key) return []

  const res = await fetchWithTimeout(`https://openlibrary.org/works/${key}.json`)
  if (!res.ok) return []

  const data = (await res.json()) as { subjects?: string[]; subject?: string[] }
  const subjects = data.subjects ?? data.subject ?? []
  return subjects.slice(0, 3)
}

async function fetchAppleMusicTags(entry: LogEntry): Promise<string[]> {
  const term = `${entry.title} ${entry.creator}`.trim()
  if (!term) return []

  const res = await fetchWithTimeout(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=album&limit=1`,
  )
  if (!res.ok) return []

  const data = (await res.json()) as {
    results?: Array<{ primaryGenreName?: string }>
  }
  const first = data.results?.[0]
  if (!first?.primaryGenreName) return []
  return [first.primaryGenreName]
}

export async function fetchTagsForEntry(entry: LogEntry): Promise<string[]> {
  const url = entry.sourceUrl?.trim()
  if (!url) return []

  try {
    if (entry.source === 'tmdb' || url.includes('themoviedb.org')) {
      return await fetchTmdbTags(url)
    }
    if (entry.source === 'openlibrary' || url.includes('openlibrary.org')) {
      return await fetchOpenLibraryTags(url)
    }
    if (entry.source === 'apple-music' || url.includes('apple.com') || url.includes('music.apple')) {
      return await fetchAppleMusicTags(entry)
    }
  } catch {
    // Keep current tags on failure
  }
  return []
}
