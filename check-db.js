const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEvent() {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: 'yvgk5xubkw' }
    });

    console.log('Event found:', {
      title: event?.title,
      slug: event?.slug,
      completionMessage: event?.completionMessage,
      hasMessage: !!event?.completionMessage
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvent();