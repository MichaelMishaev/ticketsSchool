import { logger } from '@/lib/logger'

async function seedLogs() {
  console.log('Seeding sample logs...')

  try {
    // Create sample logs
    await logger.info('Application started successfully', {
      source: 'system',
      metadata: { version: '1.0.0', environment: 'production' }
    })

    await logger.info('User registration completed', {
      source: 'auth',
      userId: 'user123',
      metadata: { email: 'user@example.com', method: 'email' }
    })

    await logger.warn('High registration volume detected', {
      source: 'system',
      metadata: { registrations_per_minute: 150, threshold: 100 }
    })

    await logger.error('Database connection timeout', {
      source: 'database',
      metadata: {
        error: 'Connection timeout after 30 seconds',
        host: 'localhost',
        port: 5432
      }
    })

    await logger.info('Event created successfully', {
      source: 'api',
      eventId: 'evt123',
      metadata: { title: 'Sample Event', capacity: 100 }
    })

    await logger.debug('API request processed', {
      source: 'api',
      metadata: {
        method: 'POST',
        endpoint: '/api/events',
        duration_ms: 245,
        status: 200
      }
    })

    console.log('Sample logs created successfully!')
  } catch (error) {
    console.error('Error seeding logs:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedLogs().then(() => process.exit(0))
}

export default seedLogs