import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('Cleaning up test data...')
  
  try {
    // Delete test schools and all related data (cascade)
    const result = await prisma.school.deleteMany({
      where: {
        OR: [
          { slug: { startsWith: 'test-school-' } },
          { slug: { startsWith: 'performance-test-' } },
          { name: { contains: 'Test' } }
        ]
      }
    })
    
    console.log(`✅ Deleted ${result.count} test schools`)
  } catch (error) {
    console.error('Error cleaning up:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
