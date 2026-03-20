import { AddLine, ArrowLeftLine } from '@mingcute/react'
import { Link } from 'react-router-dom'

import { DetailListRow } from '../components/DetailListRow'
import { categoryDetailMeta, categoryMeta } from '../data/seed'
import {
  computeTopGenres,
  computeTopMetric,
  genrePieBackground,
  genreSliceColor,
} from '../lib/stats'
import type { LogEntry, MediaCategory, MediaSuggestion } from '../types/media'

interface CategoryDetailPageProps {
  category: MediaCategory
  entries: LogEntry[]
  trending: MediaSuggestion[]
  onOpenModal: (category: MediaCategory) => void
  onEditEntry: (entry: LogEntry) => void
  onDeleteEntry: (id: string) => void
}

function isLogEntry(item: LogEntry | MediaSuggestion): item is LogEntry {
  return 'notes' in item && 'loggedAt' in item && 'rating' in item
}

export function CategoryDetailPage({
  category,
  entries,
  trending,
  onOpenModal,
  onEditEntry,
  onDeleteEntry,
}: CategoryDetailPageProps) {
  const meta = categoryDetailMeta[category]
  const rowItems = entries.length > 0 ? entries : trending.slice(0, 3)
  const topMetric = computeTopMetric(entries, category)
  const topGenres = computeTopGenres(entries)

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
              <span className="detail-section__count">{entries.length} {categoryMeta[category].actionLabel}</span>
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
                  duration={item.duration}
                  metricLabel={meta.rowMetricLabel}
                  entryId={isLogEntry(item) ? item.id : undefined}
                  onEdit={isLogEntry(item) ? () => onEditEntry(item) : undefined}
                  onDelete={isLogEntry(item) ? onDeleteEntry : undefined}
                />
              ))}
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="daily-average-card">
              <h3>{topMetric.label}</h3>
              <div className="daily-average-card__value">{topMetric.value}</div>
            </div>

            <div className="genre-card">
              <div className="genre-card__header">
                <h3>{meta.genreTitle}</h3>
              </div>
              <div
                className="pie-container"
                style={{ background: genrePieBackground(topGenres) }}
                aria-hidden={topGenres.length === 0}
              >
                <div className="pie-dot-fill" />
                <div className="pie-outline" />
              </div>
              {topGenres.length > 0 ? (
                <ul className="genre-legends">
                  {topGenres.map((g, i) => (
                    <li key={`${g.name}-${i}`} className="genre-legend">
                      <div
                        className="genre-legend__dot"
                        style={{ background: genreSliceColor(i) }}
                      />
                      <span>
                        {g.name} <span className="genre-legend__pct">({g.percent}%)</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="genre-empty">
                  {entries.length > 0
                    ? 'No tags on your entries yet — tags appear from picks or edits.'
                    : 'Add logs with genre tags to see this chart.'}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
