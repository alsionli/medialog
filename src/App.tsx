import { useEffect, useMemo, useRef, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'

import './App.css'
import { AddEntryModal } from './components/AddEntryModal'
import { categoryMeta } from './data/seed'
import { fetchTagsForEntry } from './lib/fetchTags'
import { loadEntries, saveEntries } from './lib/storage'
import { fetchTrendingByCategory, searchByCategory } from './lib/trending'
import { ArchiveHomePage } from './pages/ArchiveHomePage'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import type { LogEntry, MediaCategory, MediaSuggestion } from './types/media'

type TrendingState = Record<MediaCategory, MediaSuggestion[]>
type LoadingState = Record<MediaCategory, boolean>

const DEFAULT_DURATION: Record<MediaCategory, number> = {
  screen: 2,
  album: 0.5,
  book: 300,
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

function needsTagMigration(entry: LogEntry): boolean {
  return hasApiSourceUrl(entry)
}

interface EntryDraft {
  category: MediaCategory
  title: string
  creator: string
  rating: number
  notes: string
  releaseDate: string
  coverUrl: string
  sourceLabel: string
  sourceUrl: string
  tags: string[]
  duration: number
}

function createEmptyDraft(category: MediaCategory): EntryDraft {
  return {
    category,
    title: '',
    creator: '',
    rating: 0,
    notes: '',
    releaseDate: '',
    coverUrl: '',
    sourceLabel: categoryMeta[category].sourceHint,
    sourceUrl: '',
    tags: [],
    duration: DEFAULT_DURATION[category],
  }
}

function App() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<LogEntry[]>(() => loadEntries())
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<EntryDraft>(createEmptyDraft('screen'))
  const [trending, setTrending] = useState<TrendingState>({
    screen: [],
    book: [],
    album: [],
  })
  const [, setLoadingByCategory] = useState<LoadingState>({
    screen: true,
    book: true,
    album: true,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MediaSuggestion[]>([])
  const [, setSearchLoading] = useState(false)
  const [addStep, setAddStep] = useState<1 | 2>(1)

  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  const fetchedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const toMigrate = entries.filter((e) => needsTagMigration(e) && !fetchedIdsRef.current.has(e.id))
    if (toMigrate.length === 0) return

    toMigrate.forEach((e) => fetchedIdsRef.current.add(e.id))
    let cancelled = false
    Promise.all(
      toMigrate.map(async (entry) => {
        const tags = await fetchTagsForEntry(entry)
        return { entry, tags }
      }),
    ).then((results) => {
      if (cancelled) return
      const updated = results.filter((r) => r.tags.length > 0)
      if (updated.length === 0) return
      setEntries((current) => {
        let changed = false
        const next = current.map((e) => {
          const found = updated.find((u) => u.entry.id === e.id)
          if (!found) return e
          const same = found.tags.length === e.tags?.length && found.tags.every((t, i) => t === e.tags?.[i])
          if (same) return e
          changed = true
          return { ...e, tags: found.tags }
        })
        return changed ? next : current
      })
    })

    return () => {
      cancelled = true
    }
  }, [entries])

  useEffect(() => {
    ;(['screen', 'book', 'album'] as MediaCategory[]).forEach(async (category) => {
      const items = await fetchTrendingByCategory(category)

      setTrending((current) => ({
        ...current,
        [category]: items,
      }))
      setLoadingByCategory((current) => ({
        ...current,
        [category]: false,
      }))
    })
  }, [])

  const totalEntries = entries.length
  const counts = useMemo(
    () => ({
      screen: entries.filter((entry) => entry.category === 'screen').length,
      book: entries.filter((entry) => entry.category === 'book').length,
      album: entries.filter((entry) => entry.category === 'album').length,
    }),
    [entries],
  )

  const modalSuggestions = trending[draft.category]

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    const timer = setTimeout(async () => {
      const results = await searchByCategory(draft.category, searchQuery)
      setSearchResults(results)
      setSearchLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, draft.category])

  function openModal(category: MediaCategory) {
    setDraft(createEmptyDraft(category))
    setSearchQuery('')
    setSearchResults([])
    setAddStep(1)
    setModalOpen(true)
  }

  function handleCategoryChange(category: MediaCategory) {
    setDraft(createEmptyDraft(category))
    setSearchQuery('')
    setSearchResults([])
    setAddStep(1)
  }

  function handleSelectSuggestion(item: MediaSuggestion) {
    setDraft({
      category: item.category,
      title: item.title,
      creator: item.creator,
      rating: 0,
      notes: '',
      releaseDate: item.releaseDate ?? '',
      coverUrl: item.coverUrl ?? '',
      sourceLabel: item.sourceLabel,
      sourceUrl: item.sourceUrl ?? '',
      tags: item.tags ?? [],
      duration: item.duration ?? DEFAULT_DURATION[item.category],
    })
    setAddStep(2)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setAddStep(1)
  }

  function handleDraftChange(field: keyof EntryDraft, value: string | number) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleDeleteEntry(id: string) {
    setEntries((current) => current.filter((e) => e.id !== id))
  }

  function handleSubmit() {
    if (!draft.title.trim() || !draft.rating) {
      return
    }

    const nextEntry: LogEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
      category: draft.category,
      title: draft.title.trim(),
      creator: draft.creator.trim() || '—',
      rating: Number(draft.rating),
      notes: draft.notes.trim(),
      loggedAt: new Date().toISOString().slice(0, 10),
      releaseDate: draft.releaseDate.trim() || undefined,
      coverUrl: draft.coverUrl || undefined,
      source: draft.sourceLabel.toLowerCase().includes('tmdb')
        ? 'tmdb'
        : draft.sourceLabel.toLowerCase().includes('apple')
          ? 'apple-music'
          : draft.sourceLabel.toLowerCase().includes('open')
            ? 'openlibrary'
            : 'manual',
      sourceLabel: 'Manual entry',
      sourceUrl: draft.sourceUrl.trim() || undefined,
      tags: draft.tags?.length ? draft.tags : undefined,
      duration: draft.duration,
    }

    setEntries((current) => [nextEntry, ...current])
    handleCloseModal()
    navigate(`/${draft.category}`)
    setDraft(createEmptyDraft(draft.category))
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <ArchiveHomePage
              counts={counts}
              totalEntries={totalEntries}
              onOpenModal={openModal}
              onOpenCategory={(category) => navigate(`/${category}`)}
            />
          }
        />
        {(['screen', 'album', 'book'] as MediaCategory[]).map((category) => (
          <Route
            key={category}
            path={`/${category}`}
            element={
              <CategoryDetailPage
                category={category}
                entries={entries
                  .filter((entry) => entry.category === category)
                  .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))}
                trending={trending[category]}
                onOpenModal={openModal}
                onDeleteEntry={handleDeleteEntry}
              />
            }
          />
        ))}
      </Routes>

      <AddEntryModal
        open={modalOpen}
        draft={draft}
        suggestions={modalSuggestions}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        addStep={addStep}
        onBackToSearch={() => setAddStep(1)}
        onClose={handleCloseModal}
        onCategoryChange={handleCategoryChange}
        onSelectSuggestion={handleSelectSuggestion}
        onDraftChange={handleDraftChange}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default App
