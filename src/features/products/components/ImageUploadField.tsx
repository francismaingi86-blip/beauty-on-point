import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { validateImageFile, uploadProductImage } from '../api/upload-image'
import { Button } from '@/components/ui/button'

interface ImageUploadFieldProps {
  productId: string
  value?: string
  onChange: (url: string | undefined) => void
}

export function ImageUploadField({ productId, value, onChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    try {
      const url = await uploadProductImage(file, productId)
      onChange(url)
    } catch {
      setError('Upload failed. Check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">Product photo</span>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-brand-black-50 dark:bg-white/5">
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-brand-pink-400" />
          ) : value ? (
            <img src={value} alt="Product" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-[var(--text-muted)]" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {value ? 'Replace photo' : 'Upload photo'}
          </Button>
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
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
