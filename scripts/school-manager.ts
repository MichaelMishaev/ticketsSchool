#!/usr/bin/env tsx
/**
 * School Management Automation Tool
 *
 * Usage:
 *   npm run school -- create <name> <slug> [options]
 *   npm run school -- list
 *   npm run school -- create-admin <email> <name> <password> [schoolSlug]
 *   npm run school -- migrate-events <schoolSlug>
 *   npm run school -- seed
 *
 * Examples:
 *   npm run school -- create "Beeri School" beeri --color "#10b981" --logo "https://example.com/logo.png"
 *   npm run school -- create-admin admin@beeri.com "Admin Name" password123 beeri
 *   npm run school -- create-admin superadmin@school.com "Super Admin" password123
 *   npm run school -- migrate-events beeri
 *   npm run school -- seed
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface CreateSchoolOptions {
  color?: string
  logo?: string
}

interface CreateAdminOptions {
  schoolSlug?: string
  isSuperAdmin?: boolean
}

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function createSchool(name: string, slug: string, options: CreateSchoolOptions = {}) {
  try {
    log(`\n📚 Creating school: ${name} (${slug})...`, colors.blue)

    const school = await prisma.school.create({
      data: {
        name,
        slug,
        primaryColor: options.color || '#3b82f6',
        logo: options.logo,
        isActive: true,
      }
    })

    log(`✅ School created successfully!`, colors.green)
    log(`   ID: ${school.id}`, colors.cyan)
    log(`   Name: ${school.name}`, colors.cyan)
    log(`   Slug: ${school.slug}`, colors.cyan)
    log(`   Color: ${school.primaryColor}`, colors.cyan)
    if (school.logo) log(`   Logo: ${school.logo}`, colors.cyan)

    return school
  } catch (error: any) {
    log(`❌ Failed to create school: ${error.message}`, colors.red)
    throw error
  }
}

async function listSchools() {
  try {
    log(`\n📋 Listing all schools...`, colors.blue)

    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            events: true,
            admins: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (schools.length === 0) {
      log(`   No schools found.`, colors.yellow)
      return
    }

    schools.forEach((school, index) => {
      log(`\n${index + 1}. ${school.name} ${school.isActive ? '✓' : '✗'}`, colors.bold)
      log(`   Slug: ${school.slug}`, colors.cyan)
      log(`   Color: ${school.primaryColor}`, colors.cyan)
      log(`   Events: ${school._count.events}`, colors.cyan)
      log(`   Admins: ${school._count.admins}`, colors.cyan)
      log(`   Created: ${school.createdAt.toLocaleDateString()}`, colors.cyan)
    })

    log(`\n📊 Total schools: ${schools.length}`, colors.green)
  } catch (error: any) {
    log(`❌ Failed to list schools: ${error.message}`, colors.red)
    throw error
  }
}

async function createAdmin(
  email: string,
  name: string,
  password: string,
  options: CreateAdminOptions = {}
) {
  try {
    const isSuperAdmin = !options.schoolSlug
    log(`\n👤 Creating ${isSuperAdmin ? 'SUPER ADMIN' : 'school admin'}: ${email}...`, colors.blue)

    // Find school if provided
    let schoolId: string | null = null
    if (options.schoolSlug) {
      const school = await prisma.school.findUnique({
        where: { slug: options.schoolSlug }
      })

      if (!school) {
        log(`❌ School not found: ${options.schoolSlug}`, colors.red)
        throw new Error(`School not found: ${options.schoolSlug}`)
      }

      schoolId = school.id
      log(`   Assigning to school: ${school.name}`, colors.cyan)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await prisma.admin.create({
      data: {
        email,
        name,
        passwordHash,
        role: isSuperAdmin ? 'SUPER_ADMIN' : 'SCHOOL_ADMIN',
        schoolId,
      },
      include: {
        school: true
      }
    })

    log(`✅ Admin created successfully!`, colors.green)
    log(`   ID: ${admin.id}`, colors.cyan)
    log(`   Email: ${admin.email}`, colors.cyan)
    log(`   Name: ${admin.name}`, colors.cyan)
    log(`   Role: ${admin.role}`, colors.cyan)
    if (admin.school) {
      log(`   School: ${admin.school.name}`, colors.cyan)
    }

    return admin
  } catch (error: any) {
    log(`❌ Failed to create admin: ${error.message}`, colors.red)
    throw error
  }
}

async function migrateEventsToSchool(schoolSlug: string) {
  try {
    log(`\n🔄 Migrating events to school: ${schoolSlug}...`, colors.blue)

    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug }
    })

    if (!school) {
      log(`❌ School not found: ${schoolSlug}`, colors.red)
      throw new Error(`School not found: ${schoolSlug}`)
    }

    // Find events without schoolId
    const eventsWithoutSchool = await prisma.event.findMany({
      where: {
        schoolId: null as any // TypeScript workaround for migration
      }
    })

    log(`   Found ${eventsWithoutSchool.length} events to migrate`, colors.cyan)

    // Update all events
    const result = await prisma.event.updateMany({
      where: {
        schoolId: null as any
      },
      data: {
        schoolId: school.id
      }
    })

    log(`✅ Migrated ${result.count} events to ${school.name}`, colors.green)

    return result
  } catch (error: any) {
    log(`❌ Failed to migrate events: ${error.message}`, colors.red)
    throw error
  }
}

async function seed() {
  try {
    log(`\n🌱 Seeding database with initial data...`, colors.blue)

    // Create default school
    log(`\n1️⃣  Creating default school...`, colors.yellow)
    const beeriSchool = await createSchool('Beeri School', 'beeri', {
      color: '#10b981',
    })

    // Create super admin
    log(`\n2️⃣  Creating super admin...`, colors.yellow)
    const superAdmin = await createAdmin(
      'superadmin@ticketsschool.com',
      'Super Admin',
      'admin123',
      {}
    )

    // Create school admin for Beeri
    log(`\n3️⃣  Creating school admin for Beeri...`, colors.yellow)
    const beeriAdmin = await createAdmin(
      'admin@beeri.com',
      'Beeri Admin',
      'beeri123',
      { schoolSlug: 'beeri' }
    )

    // Migrate existing events to Beeri
    log(`\n4️⃣  Migrating existing events to Beeri school...`, colors.yellow)
    try {
      await migrateEventsToSchool('beeri')
    } catch (error) {
      log(`   ℹ️  No events to migrate (this is OK on first run)`, colors.yellow)
    }

    log(`\n✅ Seeding completed successfully!`, colors.green)
    log(`\n📝 Login credentials:`, colors.bold)
    log(`   Super Admin:`, colors.cyan)
    log(`     Email: superadmin@ticketsschool.com`, colors.cyan)
    log(`     Password: admin123`, colors.cyan)
    log(`   Beeri Admin:`, colors.cyan)
    log(`     Email: admin@beeri.com`, colors.cyan)
    log(`     Password: beeri123`, colors.cyan)
    log(`\n⚠️  IMPORTANT: Change these passwords in production!`, colors.red)

  } catch (error: any) {
    log(`❌ Seeding failed: ${error.message}`, colors.red)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case 'create':
        if (args.length < 3) {
          log(`Usage: npm run school -- create <name> <slug> [--color <color>] [--logo <url>]`, colors.yellow)
          process.exit(1)
        }
        const name = args[1]
        const slug = args[2]
        const colorIndex = args.indexOf('--color')
        const logoIndex = args.indexOf('--logo')
        await createSchool(name, slug, {
          color: colorIndex !== -1 ? args[colorIndex + 1] : undefined,
          logo: logoIndex !== -1 ? args[logoIndex + 1] : undefined,
        })
        break

      case 'list':
        await listSchools()
        break

      case 'create-admin':
        if (args.length < 4) {
          log(`Usage: npm run school -- create-admin <email> <name> <password> [schoolSlug]`, colors.yellow)
          process.exit(1)
        }
        await createAdmin(args[1], args[2], args[3], {
          schoolSlug: args[4]
        })
        break

      case 'migrate-events':
        if (args.length < 2) {
          log(`Usage: npm run school -- migrate-events <schoolSlug>`, colors.yellow)
          process.exit(1)
        }
        await migrateEventsToSchool(args[1])
        break

      case 'seed':
        await seed()
        break

      default:
        log(`\n📚 School Management Tool`, colors.bold)
        log(`\nAvailable commands:`, colors.cyan)
        log(`  create <name> <slug> [--color <color>] [--logo <url>]`, colors.reset)
        log(`  list`, colors.reset)
        log(`  create-admin <email> <name> <password> [schoolSlug]`, colors.reset)
        log(`  migrate-events <schoolSlug>`, colors.reset)
        log(`  seed`, colors.reset)
        log(`\nExamples:`, colors.cyan)
        log(`  npm run school -- create "Herzl School" herzl --color "#3b82f6"`, colors.reset)
        log(`  npm run school -- list`, colors.reset)
        log(`  npm run school -- create-admin admin@herzl.com "Admin" pass123 herzl`, colors.reset)
        log(`  npm run school -- seed`, colors.reset)
        break
    }
  } catch (error) {
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
