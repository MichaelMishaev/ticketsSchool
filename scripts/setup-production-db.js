#!/usr/bin/env node

/**
 * Production Database Setup Script
 *
 * This script ensures the production database is properly set up with:
 * - All required tables and schema
 * - Proper indexes
 * - Enum types
 *
 * Usage:
 *   node scripts/setup-production-db.js
 *
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string for production
 */

const { execSync } = require('child_process');
const path = require('path');

function logStep(message) {
  console.log(`\n🔧 ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

async function setupDatabase() {
  try {
    logStep('Starting production database setup...');

    // Check environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    logSuccess('Database URL configured');

    // Generate Prisma client
    logStep('Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    logSuccess('Prisma client generated');

    // Deploy migrations
    logStep('Deploying database migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    logSuccess('Migrations deployed successfully');

    // Verify deployment
    logStep('Verifying database status...');
    execSync('npx prisma migrate status', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    logSuccess('Database setup completed successfully!');
    console.log('\n📋 Production database is ready with:');
    console.log('  • Event table with all fields and indexes');
    console.log('  • Registration table with relationships');
    console.log('  • EventStatus and RegistrationStatus enums');
    console.log('  • All foreign key constraints');
    console.log('  • Optimized indexes for performance');

  } catch (error) {
    logError(`Database setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };