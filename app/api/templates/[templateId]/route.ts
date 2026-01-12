import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

// DELETE /api/templates/[templateId] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const admin = await requireAdmin()

    // Fetch template to verify ownership
    const template = await prisma.tableTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of own templates (or SUPER_ADMIN can delete any)
    if (admin.role !== 'SUPER_ADMIN' && template.schoolId !== admin.schoolId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Cannot delete public templates unless SUPER_ADMIN
    if (template.isPublic && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete public templates' },
        { status: 403 }
      )
    }

    await prisma.tableTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
