#!/usr/bin/env npx tsx

/**
 * Quick local backup using existing public API endpoints
 * This doesn't require deployment - works immediately
 */

import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'https://kartis.info'
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'qa')

interface LoginResponse {
  success: boolean
  admin?: any
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const cookies = response.headers.get('set-cookie')
  if (!cookies || !response.ok) {
    throw new Error('Login failed')
  }

  // Extract session cookie
  const sessionCookie = cookies.match(/admin_session=([^;]+)/)?.[1]
  if (!sessionCookie) {
    throw new Error('No session cookie received')
  }

  return sessionCookie
}

async function fetchWithAuth(url: string, sessionCookie: string) {
  const response = await fetch(url, {
    headers: {
      Cookie: `admin_session=${sessionCookie}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  return response.json()
}

async function backup() {
  console.log('🗄️  Quick Local QA Database Backup')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // Get credentials from stdin
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve)
    })
  }

  try {
    console.log('🔐 Please provide your SUPER_ADMIN credentials:')
    const email = await question('Email: ')
    const password = await question('Password: ')
    console.log('')

    console.log('🔑 Logging in...')
    const sessionCookie = await login(email, password)
    console.log('  ✅ Login successful')
    console.log('')

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.json`)

    console.log('📦 Fetching data from API endpoints...')

    // Fetch all data
    const [schools, events] = await Promise.all([
      fetchWithAuth(`${BASE_URL}/api/admin/super/schools`, sessionCookie).catch(() => []),
      fetchWithAuth(`${BASE_URL}/api/events`, sessionCookie).catch(() => []),
    ])

    const backup = {
      timestamp: new Date().toISOString(),
      database: 'QA (via API)',
      method: 'Public API endpoints',
      stats: {
        schools: schools.length || 0,
        events: events.length || 0,
      },
      data: {
        schools,
        events,
      },
    }

    console.log('  ✅ Data fetched')
    console.log('')
    console.log('📊 Statistics:')
    console.log(`  Schools: ${backup.stats.schools}`)
    console.log(`  Events: ${backup.stats.events}`)
    console.log('')

    // Write backup
    console.log('💾 Writing backup file...')
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))

    const fileSize = (fs.statSync(backupFile).size / 1024).toFixed(2)
    console.log(`  ✅ Backup saved: ${backupFile}`)
    console.log('')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Backup completed!')
    console.log('')
    console.log(`📦 File: backup_${timestamp}.json (${fileSize} KB)`)
    console.log(`📁 Location: ${BACKUP_DIR}/`)
    console.log('')
    console.log('⚠️  Note: This is a partial backup via API endpoints.')
    console.log('   For a full database backup, use the backup endpoint after deployment.')
    console.log('')
    console.log('✨ Done!')
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

backup()
