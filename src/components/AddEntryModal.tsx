import {
  ArrowLeftLine,
  CloseLine,
  SearchLine,
  StarFill,
  StarLine,
} from '@mingcute/react'

import { categoryMeta } from '../data/seed'
import type { MediaCategory, MediaSuggestion } from '../types/media'
import { CoverImage } from './CoverImage'

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

interface AddEntryModalProps {
  open: boolean
  draft: EntryDraft
  suggestions: MediaSuggestion[]
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  searchResults: MediaSuggestion[]
  addStep: 1 | 2
  onBackToSearch: () => void
  onClose: () => void
  onCategoryChange: (category: MediaCategory) => void
  onSelectSuggestion: (item: MediaSuggestion) => void
  onDraftChange: (field: keyof EntryDraft, value: string | number) => void
  onSubmit: () => void
}

const categories: MediaCategory[] = ['screen', 'book', 'album']

export function AddEntryModal({
  open,
  draft,
  suggestions,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  addStep,
  onBackToSearch,
  onClose,
  onCategoryChange,
  onSelectSuggestion,
  onDraftChange,
  onSubmit,
}: AddEntryModalProps) {
  if (!open) {
    return null
  }

  const displayItems = searchQuery.trim() ? searchResults : suggestions.slice(0, 3)

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className={`entry-modal ${addStep === 2 ? 'entry-modal--step-2' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="entry-modal__header">
          <div className="entry-modal__header-left">
            {addStep === 2 && (
              <button
                className="icon-circle-button icon-circle-button--ghost"
                type="button"
                onClick={onBackToSearch}
                aria-label="Back to search"
              >
                <ArrowLeftLine size={16} strokeWidth={1.2} />
              </button>
            )}
            <h2 id="entry-modal-title">
              {addStep === 1 ? 'New Entry' : 'Rate & Notes'}
            </h2>
          </div>

          <button className="icon-circle-button icon-circle-button--ghost" type="button" onClick={onClose}>
            <CloseLine size={16} strokeWidth={1.2} />
          </button>
        </div>

        <div className="entry-modal__content">
          {addStep === 1 ? (
            <>
              <div className="entry-modal__section">
                <p className="section-label">Category</p>
                <div className="category-tabs">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`category-tab ${draft.category === category ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => onCategoryChange(category)}
                    >
                      {categoryMeta[category].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="entry-modal__section">
                <label className="input-group">
                  <span className="section-label">Search</span>
                  <div className="search-input-wrap">
                    <span className="search-input__icon" aria-hidden>
                      <SearchLine size={18} strokeWidth={1.2} />
                    </span>
                    <input
                      type="search"
                      className="search-input"
                      value={searchQuery}
                      onChange={(event) => onSearchQueryChange(event.target.value)}
                      placeholder={
                        draft.category === 'screen'
                          ? 'Search movies & TV...'
                          : draft.category === 'book'
                            ? 'Search books...'
                            : 'Search albums...'
                      }
                    />
                  </div>
                </label>

                <div className="suggestions-header">
                  <p className="section-label">
                    {searchQuery.trim() ? 'Search results' : 'Trending picks'}
                  </p>
                </div>

                <div className="suggestion-scroller">
                  {displayItems.map((item) => (
                    <button
                      key={item.id}
                      className={`suggestion-card ${
                        draft.title === item.title ? 'is-active' : ''
                      }`}
                      type="button"
                      onClick={() => onSelectSuggestion(item)}
                    >
                      <CoverImage
                        src={item.coverUrl}
                        alt={item.title}
                        className="suggestion-card__cover"
                      />

                      <div className="suggestion-card__text">
                        <strong>{item.title}</strong>
                        <span>{item.creator}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="entry-modal__section entry-modal__selected-preview">
                <div className="selected-preview">
                  <CoverImage
                    src={draft.coverUrl}
                    alt={draft.title}
                    className="selected-preview__cover"
                  />
                  <div className="selected-preview__text">
                    <strong>{draft.title}</strong>
                    <span>{draft.creator}</span>
                    {draft.tags?.length ? (
                      <div className="selected-preview__tags">
                        {draft.tags.map((tag) => (
                          <span key={tag} className="selected-preview__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="entry-modal__fields">
                <div className="input-group input-group--rating-row">
                  <span className="section-label">Rating</span>
                  <div className="rating-selector">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        className="rating-chip rating-chip--star"
                        type="button"
                        onClick={() => onDraftChange('rating', rating)}
                        aria-label={`${rating} star rating`}
                      >
                        {draft.rating >= rating ? (
                          <StarFill size={20} strokeWidth={1.2} />
                        ) : (
                          <StarLine size={20} strokeWidth={1.2} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="input-group">
                  <span className="section-label">Notes</span>
                  <textarea
                    className="notes-textarea"
                    value={draft.notes}
                    onChange={(event) => onDraftChange('notes', event.target.value)}
                    placeholder="What stood out, what stayed with you, and what you'd want to remember later."
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {addStep === 2 && (
          <div className="entry-modal__footer">
            <div className="dot-strip" aria-hidden="true" />
            <button
              className="submit-button"
              type="button"
              onClick={onSubmit}
              disabled={!draft.rating}
            >
              Log to archive
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
