import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/compressImage'

const BUCKET = 'product-images'
const MAX_SIZE_BYTES = 8 * 1024 * 1024 // checked before compression, so a fresh phone photo isn't rejected

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > MAX_SIZE_BYTES) return 'Image must be smaller than 8MB.'
  return null
}

/** Compresses, then uploads an image and returns its public URL. Requires an internet connection. */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const compressed = await compressImage(file)
  const path = `${productId}/${Date.now()}.jpg`

  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
