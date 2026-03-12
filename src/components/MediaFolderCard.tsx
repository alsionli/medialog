import { AddLine } from '@mingcute/react'

import { categoryMeta } from '../data/seed'
import type { MediaCategory } from '../types/media'

interface MediaFolderCardProps {
  category: MediaCategory
  count: number
  active: boolean
  onSelect: () => void
  onAdd: () => void
}

function CinemaDots() {
  return (
    <svg aria-hidden="true" className="folder-card__svg folder-card__svg--screen" viewBox="0 0 180 120">
      <defs>
        <linearGradient id="cinemaFlow" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#0a0a0a" />
          <stop offset="0.2" stopColor="#404040" />
          <stop offset="0.4" stopColor="#171717" />
          <stop offset="0.5" stopColor="#737373" />
          <stop offset="0.6" stopColor="#171717" />
          <stop offset="0.8" stopColor="#404040" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <pattern id="cinemaDotsMask" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="white" />
        </pattern>
        <mask id="cinemaDotMask">
          <rect width="360" height="120" fill="url(#cinemaDotsMask)" />
        </mask>
        <clipPath id="cinemaClip">
          <rect width="180" height="120" />
        </clipPath>
      </defs>
      <g clipPath="url(#cinemaClip)">
        <rect
          className="folder-card__dots-flow"
          width="360"
          height="120"
          fill="url(#cinemaFlow)"
          mask="url(#cinemaDotMask)"
        />
      </g>
      <path d="M78 36L118 60L78 84V36Z" fill="var(--folder-triangle-fill)" />
    </svg>
  )
}

function AudioDots() {
  return (
    <svg aria-hidden="true" className="folder-card__svg folder-card__svg--album" viewBox="0 0 170 170">
      <defs>
        <pattern id="audioDots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="currentColor" />
        </pattern>
        <mask id="audioMask">
          <rect width="170" height="170" fill="black" />
          <circle cx="85" cy="85" r="58" fill="white" />
        </mask>
      </defs>
      <circle cx="85" cy="85" r="80" fill="url(#audioDots)" mask="url(#audioMask)" />
    </svg>
  )
}

function LiteratureDots() {
  return (
    <div aria-hidden="true" className="folder-card__book-visual">
      <div className="folder-card__book-spine" />
      <svg className="folder-card__svg folder-card__svg--book" viewBox="0 0 114 180">
        <defs>
          <linearGradient id="bookFlow" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#0a0a0a" />
            <stop offset="0.2" stopColor="#404040" />
            <stop offset="0.4" stopColor="#171717" />
            <stop offset="0.5" stopColor="#737373" />
            <stop offset="0.6" stopColor="#171717" />
            <stop offset="0.8" stopColor="#404040" />
            <stop offset="1" stopColor="#0a0a0a" />
          </linearGradient>
          <pattern id="bookDotsMask" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.8" fill="white" />
          </pattern>
          <mask id="bookDotMask">
            <rect width="228" height="180" fill="url(#bookDotsMask)" />
          </mask>
          <clipPath id="bookClip">
            <rect width="114" height="180" />
          </clipPath>
        </defs>
        <g clipPath="url(#bookClip)">
          <rect
            className="folder-card__dots-flow"
            width="228"
            height="180"
            fill="url(#bookFlow)"
            mask="url(#bookDotMask)"
          />
        </g>
      </svg>
    </div>
  )
}

function FolderArt({ category }: { category: MediaCategory }) {
  if (category === 'screen') {
    return <CinemaDots />
  }

  if (category === 'album') {
    return <AudioDots />
  }

  return <LiteratureDots />
}

export function MediaFolderCard({
  category,
  count,
  active,
  onSelect,
  onAdd,
}: MediaFolderCardProps) {
  const meta = categoryMeta[category]

  return (
    <button
      className={`folder-card ${active ? 'is-active' : ''}`}
      type="button"
      onClick={onSelect}
    >
      <div className="folder-tab" />
      <div className="folder-card__header">
        <div>
          <p className="folder-card__eyebrow">{meta.cardLabel}</p>
          <p className="folder-card__count">
            {count} {meta.actionLabel}
          </p>
        </div>
      </div>

      <div className={`folder-card__art folder-card__art--${category}`}>
        <FolderArt category={category} />
      </div>

      <div className="folder-card__footer">
        <span className="folder-card__angle">{meta.angle}</span>
        <button
          className="icon-circle-button folder-card__add-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onAdd()
          }}
          aria-label={`Add ${meta.label} log`}
        >
          <AddLine size={16} strokeWidth={1.2} />
        </button>
      </div>
    </button>
  )
}
