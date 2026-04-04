/**
 * Logo storage abstraction layer
 * Supports base64 encoding (default) with future migration to S3/Cloudinary
 */

import { validateImageBuffer } from './image-validation'

/**
 * Save logo to storage
 *
 * Current implementation: Base64 encoding in database
 * Future: Can be extended to S3, Cloudinary, etc. via LOGO_STORAGE_PROVIDER env var
 *
 * @param file - Image file buffer
 * @param mimeType - MIME type (image/png, image/jpeg, image/webp)
 * @param schoolId - School ID (for future S3 key generation)
 * @returns Data URI (base64) or external URL
 */
export async function saveLogo(
  file: Buffer,
  mimeType: string,
  _schoolId: string
): Promise<string> {
  // Validate file first
  const validation = await validateImageBuffer(file, mimeType)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image')
  }

  // Future: Check LOGO_STORAGE_PROVIDER env var
  const storageProvider = process.env.LOGO_STORAGE_PROVIDER || 'database'

  if (storageProvider === 's3') {
    // Future implementation for S3
    // const key = `schools/${schoolId}/logo${getExtension(mimeType)}`
    // await s3.upload({ Bucket: process.env.S3_BUCKET, Key: key, Body: file })
    // return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`
    throw new Error('S3 storage not implemented yet')
  }

  if (storageProvider === 'cloudinary') {
    // Future implementation for Cloudinary
    throw new Error('Cloudinary storage not implemented yet')
  }

  // Default: Base64 encoding in database
  const base64 = file.toString('base64')
  return `data:${mimeType};base64,${base64}`
}

/**
 * Delete logo from storage
 *
 * Current implementation: No-op (deletion happens in database)
 * Future: Delete from S3, Cloudinary, etc.
 *
 * @param schoolId - School ID
 */
export async function deleteLogo(_schoolId: string): Promise<void> {
  const storageProvider = process.env.LOGO_STORAGE_PROVIDER || 'database'

  if (storageProvider === 's3') {
    // Future: Delete from S3
    // const key = `schools/${schoolId}/logo.*`
    // await s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: key })
    return
  }

  if (storageProvider === 'cloudinary') {
    // Future: Delete from Cloudinary
    return
  }

  // Default: No-op (database handles deletion)
  return
}

// Future helper for S3 implementation:
// function getExtension(mimeType: string): string {
//   const map: Record<string, string> = {
//     'image/png': '.png',
//     'image/jpeg': '.jpg',
//     'image/webp': '.webp',
//   }
//   return map[mimeType] || '.png'
// }
