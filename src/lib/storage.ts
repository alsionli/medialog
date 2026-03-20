import { fallbackSuggestions, INITIAL_ENTRIES_VERSION, initialEntries } from '../data/seed'
import type { LogEntry, MediaCategory } from '../types/media'

const STORAGE_KEY = 'media-log-entries-v3'
/** Tracks `INITIAL_ENTRIES_VERSION` from seed; preset rows sync when seed version increases. */
const PRESET_VERSION_KEY = 'media-log-preset-version'
const STORAGE_KEY_V2 = 'media-log-entries-v2'
const STORAGE_KEY_V1 = 'media-log-entries-v1'

const DEFAULT_DURATION: Record<MediaCategory, number> = {
  screen: 2,
  album: 0.5,
  book: 300,
}

const DEFAULT_GENRE: Record<MediaCategory, string> = {
  screen: 'General',
  album: 'Music',
  book: 'General',
}

function buildTagLookup(): Map<string, string[]> {
  const map = new Map<string, string[]>()
  const add = (category: MediaCategory, title: string, tags: string[]) => {
    if (tags?.length) {
      map.set(`${category}:${title.toLowerCase().trim()}`, tags)
    }
  }
  for (const c of ['screen', 'book', 'album'] as MediaCategory[]) {
    for (const item of fallbackSuggestions[c]) {
      add(c, item.title, item.tags ?? [])
    }
  }
  for (const entry of initialEntries) {
    if (entry.tags?.length) {
      add(entry.category, entry.title, entry.tags)
    }
  }
  return map
}

const TAG_LOOKUP = buildTagLookup()

/** Merge cover URLs from seed for known preset entry ids (fixes stale localStorage after seed updates). */
function mergeSeedCovers(entries: LogEntry[]): LogEntry[] {
  const seedById = new Map(initialEntries.map((e) => [e.id, e]))
  return entries.map((entry) => {
    const seed = seedById.get(entry.id)
    if (!seed?.coverUrl) return entry
    if (entry.coverUrl) return entry
    return { ...entry, coverUrl: seed.coverUrl }
  })
}

/** Replace preset rows (ids in `initialEntries`) with latest seed metadata; keep rating / notes / loggedAt. */
function syncPresetRowsFromSeed(entries: LogEntry[]): LogEntry[] {
  const seedIds = new Set(initialEntries.map((e) => e.id))
  const prevById = new Map(entries.map((e) => [e.id, e]))
  const userOnly = entries.filter((e) => !seedIds.has(e.id))
  const presetSynced = initialEntries.map((seed) => {
    const prev = prevById.get(seed.id)
    if (!prev) return seed
    return {
      ...seed,
      rating: prev.rating,
      notes: prev.notes,
      loggedAt: prev.loggedAt,
    }
  })
  return [...presetSynced, ...userOnly]
}

function hasApiSourceUrl(entry: LogEntry): boolean {
  const url = entry.sourceUrl?.trim()
  if (!url) return false
  return (
    entry.source === 'tmdb' ||
    entry.source === 'openlibrary' ||
    entry.source === 'apple-music' ||
    url.includes('themoviedb.org') ||
    url.includes('openlibrary.org') ||
    url.includes('apple.com')
  )
}

function migrateEntry(entry: LogEntry): LogEntry {
  const hasRealTags = entry.tags?.length && entry.tags.some((t) => t !== DEFAULT_GENRE[entry.category])
  let tags: string[]
  if (hasApiSourceUrl(entry) && !hasRealTags) {
    tags = [DEFAULT_GENRE[entry.category]]
  } else if (hasRealTags) {
    tags = entry.tags!
  } else {
    const key = `${entry.category}:${entry.title.toLowerCase().trim()}`
    tags = TAG_LOOKUP.get(key) ?? [DEFAULT_GENRE[entry.category]]
  }
  return {
    ...entry,
    tags,
    duration: entry.duration ?? DEFAULT_DURATION[entry.category],
  }
}

export function loadEntries(): LogEntry[] {
  let raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    raw = window.localStorage.getItem(STORAGE_KEY_V2)
  }
  if (!raw) {
    raw = window.localStorage.getItem(STORAGE_KEY_V1)
  }

  if (!raw) {
    if (window.localStorage.getItem(PRESET_VERSION_KEY) === null) {
      window.localStorage.setItem(PRESET_VERSION_KEY, String(INITIAL_ENTRIES_VERSION))
    }
    return initialEntries
  }

  try {
    const parsed = JSON.parse(raw) as LogEntry[]
    if (parsed.length === 0) {
      window.localStorage.setItem(PRESET_VERSION_KEY, String(INITIAL_ENTRIES_VERSION))
      return initialEntries
    }
    let migrated = mergeSeedCovers(parsed.map(migrateEntry))

    const storedPresetVer = Number(window.localStorage.getItem(PRESET_VERSION_KEY) || '0')
    if (storedPresetVer < INITIAL_ENTRIES_VERSION) {
      migrated = syncPresetRowsFromSeed(migrated).map(migrateEntry)
      window.localStorage.setItem(PRESET_VERSION_KEY, String(INITIAL_ENTRIES_VERSION))
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    window.localStorage.removeItem(STORAGE_KEY_V2)
    window.localStorage.removeItem(STORAGE_KEY_V1)
    return migrated
  } catch {
    window.localStorage.setItem(PRESET_VERSION_KEY, String(INITIAL_ENTRIES_VERSION))
    return initialEntries
  }
}

export function saveEntries(entries: LogEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}
