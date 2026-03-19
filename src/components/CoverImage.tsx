import { useState } from 'react'

import { getCoverUrl } from '../lib/cover'

interface CoverImageProps {
  src?: string | null
  alt: string
  className: string
  placeholderClassName?: string
}

export function CoverImage({ src, alt, className, placeholderClassName }: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const displayUrl = getCoverUrl(src)

  if (!displayUrl || failed) {
    return <div className={`${className} ${placeholderClassName ?? `${className}--placeholder`}`} aria-hidden />
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
