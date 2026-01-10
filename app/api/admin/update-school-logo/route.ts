import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { saveLogo, deleteLogo } from '@/lib/logo-storage'
import { validateImageFile } from '@/lib/image-validation'

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
      console.log(`[Delete Logo] Admin ${admin.email} deleting logo for school ${admin.schoolId}`)

      // Delete from storage (no-op for base64, but needed for future S3)
      await deleteLogo(admin.schoolId)

      // Update database
      const updatedSchool = await prisma.school.update({
        where: { id: admin.schoolId },
        data: { logo: null },
      })

      console.log(`[Delete Logo] ✅ Successfully deleted logo:`)
      console.log(`  School ID: ${updatedSchool.id}`)
      console.log(`  School Name: ${updatedSchool.name}`)
      console.log(`  Deleted by: ${admin.email}`)

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

      console.log(`[Upload Logo] Admin ${admin.email} uploading logo for school ${admin.schoolId}`)
      console.log(`  File name: ${file.name}`)
      console.log(`  File size: ${Math.round(file.size / 1024)}KB`)
      console.log(`  File type: ${file.type}`)

      // Client-side validation (File object)
      const validation = validateImageFile(file)
      if (!validation.valid) {
        console.log(`[Upload Logo] ❌ Validation failed: ${validation.error}`)
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

      console.log(`[Upload Logo] ✅ Successfully uploaded logo:`)
      console.log(`  School ID: ${updatedSchool.id}`)
      console.log(`  School Name: ${updatedSchool.name}`)
      console.log(`  Logo size: ${Math.round(logoDataUrl.length / 1024)}KB (base64)`)
      console.log(`  Uploaded by: ${admin.email}`)

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
    console.error('[Update Logo] Error:', error)
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
