/**
 * Image validation library for logo uploads
 * Shared validation logic for both client and server
 */

export const LOGO_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/webp'] as const,
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp'] as const,
  RECOMMENDED_DIMENSIONS: { width: 512, height: 512 },
  MAX_DIMENSIONS: { width: 1024, height: 1024 },
  MIN_DIMENSIONS: { width: 256, height: 256 },
} as const

export interface ImageValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

/**
 * Client-side validation for File objects
 * Used in browser before upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  const warnings: string[] = []

  // Check file size
  if (file.size > LOGO_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `הקובץ גדול מדי (מקסימום ${Math.round(LOGO_CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB)`,
    }
  }

  // Check MIME type
  if (!LOGO_CONFIG.ALLOWED_TYPES.includes(file.type as 'image/png' | 'image/jpeg' | 'image/webp')) {
    return {
      valid: false,
      error: 'פורמט קובץ לא נתמך. השתמש ב-PNG, JPG או WEBP',
    }
  }

  // Check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !LOGO_CONFIG.ALLOWED_EXTENSIONS.includes(extension as '.png' | '.jpg' | '.jpeg' | '.webp')) {
    warnings.push('סיומת הקובץ לא מוכרת')
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Get image dimensions from data URL (client-side)
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      reject(new Error('לא ניתן לקרוא את התמונה'))
    }

    img.src = dataUrl
  })
}

/**
 * Validate image dimensions (client-side, after file is loaded)
 */
export async function validateImageDimensions(
  dataUrl: string
): Promise<ImageValidationResult> {
  const warnings: string[] = []

  try {
    const { width, height } = await getImageDimensions(dataUrl)

    // Check max dimensions
    if (width > LOGO_CONFIG.MAX_DIMENSIONS.width || height > LOGO_CONFIG.MAX_DIMENSIONS.height) {
      return {
        valid: false,
        error: `התמונה גדולה מדי (מקסימום ${LOGO_CONFIG.MAX_DIMENSIONS.width}×${LOGO_CONFIG.MAX_DIMENSIONS.height} פיקסלים)`,
      }
    }

    // Check min dimensions (warning only)
    if (width < LOGO_CONFIG.MIN_DIMENSIONS.width || height < LOGO_CONFIG.MIN_DIMENSIONS.height) {
      warnings.push(
        `התמונה קטנה (מומלץ לפחות ${LOGO_CONFIG.MIN_DIMENSIONS.width}×${LOGO_CONFIG.MIN_DIMENSIONS.height} פיקסלים)`
      )
    }

    // Check if square (warning only)
    if (width !== height) {
      warnings.push('התמונה לא מרובעת (מומלץ תמונה מרובעת לתוצאה טובה יותר)')
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'שגיאה בקריאת התמונה',
    }
  }
}

/**
 * Server-side validation for Buffer objects
 * Used in API endpoint after upload
 *
 * Note: For dimension validation on server, you would need an image processing library like 'sharp'
 * This is a simplified version that only checks size and MIME type
 */
export async function validateImageBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<ImageValidationResult> {
  // Check buffer size
  if (buffer.length > LOGO_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `הקובץ גדול מדי (מקסימום ${Math.round(LOGO_CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB)`,
    }
  }

  // Check MIME type
  if (!LOGO_CONFIG.ALLOWED_TYPES.includes(mimeType as 'image/png' | 'image/jpeg' | 'image/webp')) {
    return {
      valid: false,
      error: 'פורמט קובץ לא נתמך. השתמש ב-PNG, JPG או WEBP',
    }
  }

  // Basic magic number validation (first few bytes)
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  const isWEBP =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50

  if (!isPNG && !isJPEG && !isWEBP) {
    return {
      valid: false,
      error: 'הקובץ אינו תמונה תקינה',
    }
  }

  return {
    valid: true,
  }
}
