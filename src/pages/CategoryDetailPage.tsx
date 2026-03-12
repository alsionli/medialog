import { AddLine, ArrowLeftLine } from '@mingcute/react'
import { Link } from 'react-router-dom'

import { DetailListRow } from '../components/DetailListRow'
import { categoryDetailMeta } from '../data/seed'
import type { LogEntry, MediaCategory, MediaSuggestion } from '../types/media'

interface CategoryDetailPageProps {
  category: MediaCategory
  entries: LogEntry[]
  trending: MediaSuggestion[]
  onOpenModal: (category: MediaCategory) => void
}

function isLogEntry(item: LogEntry | MediaSuggestion): item is LogEntry {
  return 'notes' in item && 'loggedAt' in item && 'rating' in item
}

export function CategoryDetailPage({
  category,
  entries,
  trending,
  onOpenModal,
}: CategoryDetailPageProps) {
  const meta = categoryDetailMeta[category]
  const rowItems = entries.length > 0 ? entries : trending.slice(0, 3)

  return (
    <main className="detail-shell">
      <div className="detail-workspace">
        <header className="detail-header">
          <div>
            <Link to="/" className="nav-back">
              <ArrowLeftLine size={16} strokeWidth={1.8} />
              Archive / 2026
            </Link>
            <div className="detail-header__title-row">
              <h1>{meta.title}</h1>
              <button className="icon-circle-button" type="button" onClick={() => onOpenModal(category)}>
                <AddLine size={16} strokeWidth={1.2} />
              </button>
            </div>
          </div>
        </header>

        <section className="detail-grid">
          <div className="detail-section">
            <div className="detail-section__header">
              <h2>{meta.listTitle}</h2>
            </div>

            <div className="detail-list">
              {rowItems.map((item) => (
                <DetailListRow
                  key={item.id}
                  category={category}
                  title={item.title}
                  creator={item.creator}
                  notes={isLogEntry(item) ? item.notes : undefined}
                  loggedAt={isLogEntry(item) ? item.loggedAt : undefined}
                  rating={isLogEntry(item) ? item.rating : undefined}
                  coverUrl={'coverUrl' in item ? item.coverUrl : undefined}
                />
              ))}
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="daily-average-card">
              <h3>{meta.topMetricLabel}</h3>
              <div className="daily-average-card__value">{meta.topMetricValue}</div>
            </div>

            <div className="genre-card">
              <div className="genre-card__header">
                <h3>{meta.genreTitle}</h3>
              </div>
              <div className="pie-container">
                <div className="pie-dot-fill" />
                <div className="pie-outline" />
              </div>
              <div className="genre-legend">
                <div className="genre-legend__dot" />
                <span>{meta.genreLegend}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
