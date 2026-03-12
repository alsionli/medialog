export type MediaCategory = 'screen' | 'book' | 'album'

export type TrendSource = 'tmdb' | 'openlibrary' | 'apple-music' | 'manual'

export interface MediaSuggestion {
  id: string
  category: MediaCategory
  title: string
  creator: string
  releaseDate?: string
  coverUrl?: string
  source: TrendSource
  sourceLabel: string
  sourceUrl?: string
  subtitle?: string
}

export interface LogEntry {
  id: string
  category: MediaCategory
  title: string
  creator: string
  rating: number
  notes: string
  loggedAt: string
  releaseDate?: string
  coverUrl?: string
  source: TrendSource
  sourceLabel: string
  sourceUrl?: string
}
