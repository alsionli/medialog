import { MediaFolderCard } from '../components/MediaFolderCard'
import type { MediaCategory } from '../types/media'

interface ArchiveHomePageProps {
  counts: Record<MediaCategory, number>
  totalEntries: number
  onOpenModal: (category: MediaCategory) => void
  onOpenCategory: (category: MediaCategory) => void
}

export function ArchiveHomePage({
  counts,
  totalEntries,
  onOpenModal,
  onOpenCategory,
}: ArchiveHomePageProps) {
  return (
    <main className="archive-shell">
      <header className="archive-header">
        <div>
          <p className="section-label">Archive / 2026</p>
          <h1>Media Log</h1>
        </div>

        <div className="archive-stat">
          <p className="section-label">Total Entries</p>
          <strong>{totalEntries}</strong>
        </div>
      </header>

      <section className="folder-grid">
        {(['screen', 'album', 'book'] as MediaCategory[]).map((category) => (
          <MediaFolderCard
            key={category}
            category={category}
            count={counts[category]}
            active={false}
            onSelect={() => onOpenCategory(category)}
            onAdd={() => onOpenModal(category)}
          />
        ))}
      </section>
    </main>
  )
}
