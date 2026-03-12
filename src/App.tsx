import { useEffect, useMemo, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'

import './App.css'
import { AddEntryModal } from './components/AddEntryModal'
import { categoryMeta } from './data/seed'
import { loadEntries, saveEntries } from './lib/storage'
import { fetchTrendingByCategory, searchByCategory } from './lib/trending'
import { ArchiveHomePage } from './pages/ArchiveHomePage'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import type { LogEntry, MediaCategory, MediaSuggestion } from './types/media'

type TrendingState = Record<MediaCategory, MediaSuggestion[]>
type LoadingState = Record<MediaCategory, boolean>

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
  const [loadingByCategory, setLoadingByCategory] = useState<LoadingState>({
    screen: true,
    book: true,
    album: true,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MediaSuggestion[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addStep, setAddStep] = useState<1 | 2>(1)

  useEffect(() => {
    saveEntries(entries)
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
              />
            }
          />
        ))}
      </Routes>

      <AddEntryModal
        open={modalOpen}
        draft={draft}
        suggestions={modalSuggestions}
        loading={loadingByCategory[draft.category]}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
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
