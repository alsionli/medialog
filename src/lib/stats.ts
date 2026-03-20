import type { LogEntry, MediaCategory } from '../types/media'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Format `entry.duration` for UI: hours/minutes for screen & album, page count for books.
 */
export function formatDurationMetric(
  category: MediaCategory,
  duration: number | undefined,
): string | null {
  if (duration == null || !Number.isFinite(duration) || duration <= 0) return null
  if (category === 'book') {
    return `${Math.round(duration)}p`
  }
  if (duration < 1) {
    return `${Math.round(duration * 60)}m`
  }
  return `${duration.toFixed(1)}h`
}

function getThirtyDaysAgo(): string {
  const d = new Date(Date.now() - THIRTY_DAYS_MS)
  return d.toISOString().slice(0, 10)
}

/**
 * Sum of `duration` for entries logged in the last 30 days (same window as before).
 * Books: total pages; screen/album: total hours (fractional hours summed).
 */
export function computeTopMetric(
  entries: LogEntry[],
  category: MediaCategory,
): { label: string; value: string } {
  const cutoff = getThirtyDaysAgo()
  const recent = entries.filter((e) => e.loggedAt >= cutoff)
  const total = recent.reduce((sum, e) => sum + (e.duration ?? 0), 0)

  if (total <= 0) {
    return {
      label: category === 'book' ? 'Total Pages' : 'Total Hours',
      value: '—',
    }
  }

  if (category === 'book') {
    return {
      label: 'Total Pages',
      value: `${Math.round(total)}p`,
    }
  }

  if (total < 1) {
    return {
      label: 'Total Hours',
      value: `${Math.round(total * 60)}m`,
    }
  }
  return {
    label: 'Total Hours',
    value: `${total.toFixed(1)}h`,
  }
}

/** Slice for pie + legend; `percent` is share of all tag occurrences (0–100, rounded for display). */
export interface GenreSlice {
  name: string
  count: number
  percent: number
}

const GENRE_PIE_COLORS = ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#9ca3af']

/**
 * Top genres from tags on **saved entries in this category** (what you’ve added).
 * Counts each tag mention across entries; merges overflow into "Other" when needed.
 */
export function computeTopGenres(entries: LogEntry[], limit = 5): GenreSlice[] {
  const counts: Record<string, number> = {}
  let total = 0

  for (const e of entries) {
    for (const tag of e.tags ?? []) {
      const t = tag.trim()
      if (t) {
        counts[t] = (counts[t] ?? 0) + 1
        total++
      }
    }
  }

  if (total === 0) return []

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, limit)
  const topSum = top.reduce((s, [, c]) => s + c, 0)
  const rest = total - topSum

  const slices: GenreSlice[] = top.map(([name, count]) => ({
    name,
    count,
    percent: Math.round((count / total) * 100),
  }))

  if (rest > 0 && sorted.length > limit) {
    slices.push({
      name: 'Other',
      count: rest,
      percent: Math.round((rest / total) * 100),
    })
  }

  return slices
}

/** `conic-gradient` for `.pie-container` — must match `GENRE_PIE_COLORS` order. */
export function genrePieBackground(slices: GenreSlice[]): string {
  if (slices.length === 0) return '#e5e5e5'

  const total = slices.reduce((s, x) => s + x.count, 0)
  if (total <= 0) return '#e5e5e5'

  let acc = 0
  const parts: string[] = []
  slices.forEach((s, i) => {
    const frac = (s.count / total) * 100
    const start = acc
    acc += frac
    const color = GENRE_PIE_COLORS[i % GENRE_PIE_COLORS.length]
    parts.push(`${color} ${start}% ${acc}%`)
  })

  return `conic-gradient(${parts.join(', ')})`
}

export function genreSliceColor(index: number): string {
  return GENRE_PIE_COLORS[index % GENRE_PIE_COLORS.length]
}
