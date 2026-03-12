import { initialEntries } from '../data/seed'
import type { LogEntry } from '../types/media'

const STORAGE_KEY = 'media-log-entries-v1'

export function loadEntries(): LogEntry[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return initialEntries
  }

  try {
    const parsed = JSON.parse(raw) as LogEntry[]
    return parsed.length > 0 ? parsed : initialEntries
  } catch {
    return initialEntries
  }
}

export function saveEntries(entries: LogEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}
