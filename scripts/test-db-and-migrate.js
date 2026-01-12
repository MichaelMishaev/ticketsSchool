const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing database connection...');

  // Show which DATABASE_URL we're using (masked)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
    console.log('📊 Using DATABASE_URL:', masked);
  } else {
    console.error('❌ DATABASE_URL is not set!');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Check if tables exist
    const eventCount = await prisma.event.count();
    console.log(`📈 Current number of events: ${eventCount}`);

    // Get database info
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('🗄️ Database info:', result);

    await prisma.$disconnect();
    console.log('✨ Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the test
testConnection();