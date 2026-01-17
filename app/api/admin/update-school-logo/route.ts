import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { saveLogo, deleteLogo } from '@/lib/logo-storage'
import { validateImageFile } from '@/lib/image-validation'
import { logger } from '@/lib/logger-v2'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
    }

    // Admin must have a school
    if (!admin.schoolId) {
      return NextResponse.json(
        { error: 'לא נמצא ארגון משויך למשתמש' },
        { status: 400 }
      )
    }

    // Parse multipart/form-data
    const formData = await request.formData()
    const action = formData.get('action') as string

    // Handle delete action
    if (action === 'delete') {
      logger.info('Admin deleting logo for school', { source: 'admin', adminEmail: admin.email, schoolId: admin.schoolId })

      // Delete from storage (no-op for base64, but needed for future S3)
      await deleteLogo(admin.schoolId)

      // Update database
      const updatedSchool = await prisma.school.update({
        where: { id: admin.schoolId },
        data: { logo: null },
      })

      logger.info('Successfully deleted logo', { source: 'admin', schoolId: updatedSchool.id, schoolName: updatedSchool.name, deletedBy: admin.email })

      return NextResponse.json({
        success: true,
        message: 'הלוגו הוסר בהצלחה!',
        school: {
          id: updatedSchool.id,
          name: updatedSchool.name,
          slug: updatedSchool.slug,
          logo: null,
        },
      })
    }

    // Handle upload action
    if (action === 'upload') {
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })
      }

      logger.info('Admin uploading logo for school', { source: 'admin', adminEmail: admin.email, schoolId: admin.schoolId, fileName: file.name, fileSizeKB: Math.round(file.size / 1024), fileType: file.type })

      // Client-side validation (File object)
      const validation = validateImageFile(file)
      if (!validation.valid) {
        logger.warn('Logo validation failed', { source: 'admin', validationError: validation.error })
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      // Convert to buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Save logo (converts to base64 data URI)
      const logoDataUrl = await saveLogo(buffer, file.type, admin.schoolId)

      // Update database
      const updatedSchool = await prisma.school.update({
        where: { id: admin.schoolId },
        data: { logo: logoDataUrl },
      })

      logger.info('Successfully uploaded logo', { source: 'admin', schoolId: updatedSchool.id, schoolName: updatedSchool.name, logoSizeKB: Math.round(logoDataUrl.length / 1024), uploadedBy: admin.email })

      return NextResponse.json({
        success: true,
        message: 'הלוגו עודכן בהצלחה!',
        school: {
          id: updatedSchool.id,
          name: updatedSchool.name,
          slug: updatedSchool.slug,
          logo: updatedSchool.logo,
        },
      })
    }

    // Invalid action
    return NextResponse.json(
      { error: 'פעולה לא חוקית. השתמש ב-upload או delete' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('Error updating logo', { source: 'admin', error })
    return NextResponse.json(
      {
        error: 'שגיאה בעדכון הלוגו. נסה שוב.',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    )
  }
}
