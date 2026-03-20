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

  // Open Library often blocks empty Referer; our API proxy is same-origin and unaffected.
  const referrerPolicy = displayUrl.startsWith('/api/image-proxy')
    ? 'no-referrer'
    : 'strict-origin-when-cross-origin'

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
