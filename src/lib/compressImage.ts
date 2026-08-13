const MAX_DIMENSION = 1000
const JPEG_QUALITY = 0.8

/**
 * Resizes an image to a reasonable max dimension and re-encodes it as a
 * compressed JPEG before upload. A phone photo straight off the camera is
 * often 3000×4000px and several MB — nobody needs that for a catalog
 * thumbnail or receipt, and it's the main reason product photos feel slow
 * to load. This typically cuts file size by 80-95% with no visible loss
 * at the sizes this app actually displays images.
 */
export async function compressImage(file: File): Promise<File> {
  // Already small enough — don't bother re-encoding (e.g. a small PNG icon).
  if (file.size < 300 * 1024) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    if (!blob) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    // If compression fails for any reason, fall back to the original file
    // rather than blocking the upload entirely.
    return file
  }
}
