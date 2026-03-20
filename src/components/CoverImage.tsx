import { useEffect, useState } from 'react'

import { getCoverUrl } from '../lib/cover'

interface CoverImageProps {
  src?: string | null
  alt: string
  className: string
  placeholderClassName?: string
  /** Use `eager` in modals / above-the-fold rows so `lazy` does not skip loading in scroll containers. */
  loading?: 'lazy' | 'eager'
}

export function CoverImage({
  src,
  alt,
  className,
  placeholderClassName,
  loading = 'lazy',
}: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const displayUrl = getCoverUrl(src)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!displayUrl || failed) {
    return <div className={`${className} ${placeholderClassName ?? `${className}--placeholder`}`} aria-hidden />
  }

  const referrerPolicy = displayUrl.startsWith('/api/image-proxy')
    ? 'no-referrer'
    : 'strict-origin-when-cross-origin'

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
