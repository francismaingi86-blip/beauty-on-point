import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2, Camera, ImageIcon, ZoomIn } from 'lucide-react'
import { validateImageFile, uploadProductImage } from '../api/upload-image'
import { Button } from '@/components/ui/button'
import { ImageLightbox } from '@/components/shared/ImageLightbox'
import { SmartImage } from '@/components/shared/SmartImage'

interface ImageUploadFieldProps {
  productId: string
  value?: string
  onChange: (url: string | undefined) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function ImageUploadField({ productId, value, onChange, onUploadingChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    if (!navigator.onLine) {
      setError("You're offline — connect to the internet to upload a photo, then save again.")
      return
    }

    setError(null)
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const url = await uploadProductImage(file, productId)
      onChange(url)
    } catch {
      setError('Upload failed. Check your connection and try again.')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">Product photo</span>
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => value && setLightboxOpen(true)}
          disabled={!value || uploading}
          className="group relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-brand-black-50 dark:bg-white/5"
        >
          {uploading ? (
            <Loader2 size={26} className="animate-spin text-brand-pink-400" />
          ) : value ? (
            <>
              <SmartImage src={value} alt="Product" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                <ZoomIn size={22} className="text-white" />
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-[var(--text-muted)]">
              <ImagePlus size={26} />
              <span className="text-xs">No photo yet</span>
            </div>
          )}
        </button>

        <div className="flex flex-col gap-2 pt-1">
          {/* capture="environment" opens the rear camera directly on mobile,
              instead of the usual camera-or-gallery picker. */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera size={14} /> Take photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon size={14} /> Gallery
            </Button>
          </div>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
              disabled={uploading}
            >
              <X size={14} /> Remove
            </Button>
          )}
          <p className="max-w-[220px] text-xs text-[var(--text-muted)]">
            Use good, even lighting for a clear photo — it's shown large across the catalog and receipts.
          </p>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {lightboxOpen && value && (
        <ImageLightbox src={value} alt="Product" onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  )
}
