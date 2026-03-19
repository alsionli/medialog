import type { LogEntry, MediaCategory } from '../types/media'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function getThirtyDaysAgo(): string {
  const d = new Date(Date.now() - THIRTY_DAYS_MS)
  return d.toISOString().slice(0, 10)
}

export function computeTopMetric(
  entries: LogEntry[],
  category: MediaCategory,
): { label: string; value: string } {
  const cutoff = getThirtyDaysAgo()
  const recent = entries.filter((e) => e.loggedAt >= cutoff)
  const total = recent.reduce((sum, e) => sum + (e.duration ?? 0), 0)

  if (total <= 0) {
    return {
      label: category === 'book' ? 'Avg. Daily Pages' : 'Avg. Daily Hours',
      value: '—',
    }
  }

  const avg = total / 30
  if (category === 'book') {
    return {
      label: 'Avg. Daily Pages',
      value: `${Math.round(avg)}p`,
    }
  }
  const hoursValue = Math.max(avg, 0.1)
  return {
    label: 'Avg. Daily Hours',
    value: `${hoursValue.toFixed(1)}h`,
  }
}

export function computeTopGenre(entries: LogEntry[]): string {
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

  if (total === 0) return '—'

  let top = ''
  let max = 0
  for (const [genre, n] of Object.entries(counts)) {
    if (n > max) {
      max = n
      top = genre
    }
  }

  const percent = Math.round((max / total) * 100)
  return `${top} (${percent}%)`
}
