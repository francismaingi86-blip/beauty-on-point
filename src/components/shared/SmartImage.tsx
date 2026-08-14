import { useState } from 'react'
import { RefreshCw, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
}

/**
 * A photo that failed to load (a transient network blip, a slow first
 * fetch after upload, etc.) used to just show a blank/broken image with
 * no explanation — easy to mistake for "the photo disappeared". This
 * shows a clear retry state instead, and a tap tries again with a
 * cache-busted URL rather than leaving a permanently broken image.
 */
export function SmartImage({ src, alt, className }: SmartImageProps) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  if (failed) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setFailed(false)
          setAttempt((a) => a + 1)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-1 bg-brand-black-50 text-[var(--text-muted)] dark:bg-white/5',
          className
        )}
      >
        <ImageOff size={16} />
        <span className="flex items-center gap-1 text-[10px]">
          <RefreshCw size={10} /> Retry
        </span>
      </button>
    )
  }

  return (
    <img
      src={attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
