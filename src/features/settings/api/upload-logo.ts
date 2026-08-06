import { supabase } from '@/lib/supabase'

const BUCKET = 'company-assets'
const MAX_SIZE_BYTES = 3 * 1024 * 1024 // 3MB

export function validateLogoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > MAX_SIZE_BYTES) return 'Logo must be smaller than 3MB.'
  return null
}

export async function uploadLogo(file: File): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'png'
  const path = `logo-${Date.now()}.${extension}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
