import { DeleteLine, EditLine, StarFill, StarLine } from '@mingcute/react'

import { getCoverUrl } from '../lib/cover'
import { formatDurationMetric } from '../lib/stats'
import type { MediaCategory } from '../types/media'

interface DetailListRowProps {
  category: MediaCategory
  title: string
  creator: string
  notes?: string
  loggedAt?: string
  rating?: number
  coverUrl?: string
  /** Runtime (h) / play time (h) / pages — from entry or suggestion */
  duration?: number
  /** e.g. Runtime, Play time, Pages */
  metricLabel?: string
  entryId?: string
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

function DotVisual({ category }: { category: MediaCategory }) {
  if (category === 'book') {
    return <div className="detail-art detail-art--book" />
  }

  return <div className={`detail-art detail-art--${category}`} />
}

function formatAddedTime(isoDate?: string) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DetailListRow({
  category,
  title,
  creator,
  notes,
  loggedAt,
  rating = 0,
  coverUrl,
  duration,
  metricLabel,
  entryId,
  onDelete,
  onEdit,
}: DetailListRowProps) {
  const metricValue = formatDurationMetric(category, duration)

  return (
    <article className="detail-row">
      <div className="detail-row__art">
        {coverUrl ? <img className="detail-row__art-image" src={getCoverUrl(coverUrl)} alt={title} referrerPolicy="no-referrer" loading="lazy" decoding="async" /> : <DotVisual category={category} />}
      </div>

      <div className="detail-row__copy">
        <div className="detail-row__title">{title}</div>
        <div className="detail-row__creator">{creator}</div>
        {metricValue && metricLabel ? (
          <div className="detail-row__metric" aria-label={`${metricLabel} ${metricValue}`}>
            <span className="detail-row__metric-label">{metricLabel}</span>
            <span className="detail-row__metric-value">{metricValue}</span>
          </div>
        ) : null}
        {notes ? <p className="detail-row__notes">{notes}</p> : null}
        <div className="detail-row__time">Added {formatAddedTime(loggedAt)}</div>
      </div>

      <div className="detail-row__actions">
        <div className="detail-row__rating" aria-label={`${rating} stars`}>
          {[1, 2, 3, 4, 5].map((star) =>
            rating >= star ? (
              <StarFill key={star} size={18} strokeWidth={1.2} />
            ) : (
              <StarLine key={star} size={18} strokeWidth={1.2} />
            ),
          )}
        </div>
        {entryId && (onEdit || onDelete) ? (
          <div className="detail-row__action-buttons">
            {onEdit && (
              <button
                className="detail-row__edit"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(entryId)
                }}
                aria-label={`Edit ${title}`}
              >
                <EditLine size={16} strokeWidth={1.2} />
              </button>
            )}
            {onDelete && (
              <button
                className="detail-row__delete"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(entryId)
                }}
                aria-label={`Delete ${title}`}
              >
                <DeleteLine size={16} strokeWidth={1.2} />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </article>
  )
}
