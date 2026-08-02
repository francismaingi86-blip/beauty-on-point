import { supabase } from '@/lib/supabase'

const BUCKET = 'product-images'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > MAX_SIZE_BYTES) return 'Image must be smaller than 5MB.'
  return null
}

/** Uploads an image and returns its public URL. Requires an internet connection. */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${productId}/${Date.now()}.${extension}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
