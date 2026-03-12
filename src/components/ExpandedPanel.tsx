import {
  AddLine,
  CloseLine,
} from '@mingcute/react'

import { categoryMeta } from '../data/seed'
import type { LogEntry, MediaCategory, MediaSuggestion } from '../types/media'

interface ExpandedPanelProps {
  category: MediaCategory
  entries: LogEntry[]
  trending: MediaSuggestion[]
  onOpenModal: () => void
  onClose: () => void
}

function formatCreator(value: string) {
  return value.toUpperCase()
}

export function ExpandedPanel({
  category,
  entries,
  trending,
  onOpenModal,
  onClose,
}: ExpandedPanelProps) {
  const meta = categoryMeta[category]
  const sourcePreview = trending.slice(0, 3)
  const previewItems = sourcePreview.length > 0 ? sourcePreview : entries.slice(0, 3)
  const ctaCopy =
    category === 'album'
      ? 'Tap a trending album to prefill the form'
      : category === 'screen'
        ? 'Tap a title to prefill the form'
        : 'Tap a book to prefill the form'

  return (
    <section className="expanded-panel">
      <div className="expanded-panel__header">
        <div>
          <h2>{meta.panelTitle}</h2>
        </div>
        <button className="icon-circle-button icon-circle-button--ghost" type="button" onClick={onClose}>
          <CloseLine size={16} strokeWidth={1.2} />
        </button>
      </div>

      <div className="expanded-panel__body">
        <div className="entry-strip">
          {previewItems.map((entry) => (
            <article key={entry.id} className="entry-card">
              <div className="entry-card__cover-wrap">
                {entry.coverUrl ? (
                  <img className="entry-card__cover" src={entry.coverUrl} alt={entry.title} />
                ) : (
                  <div className="entry-card__cover entry-card__cover--placeholder" />
                )}
              </div>

              <div className="entry-card__text">
                <h3>{entry.title}</h3>
                <p>{formatCreator(entry.creator)}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="expanded-panel__source">
          <p className="section-label">Trending Source</p>
          <h3>{meta.sourceHeadline}</h3>

          <div className="panel-cta" role="button" tabIndex={0} onClick={onOpenModal} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onOpenModal()
            }
          }}>
            <div className="panel-cta__button">
              <AddLine size={18} strokeWidth={1.2} color="#fafafa" />
            </div>
            <div className="panel-cta__text">
              <strong>Add a log entry with rating and notes</strong>
              <span>{ctaCopy}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
