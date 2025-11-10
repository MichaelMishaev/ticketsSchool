/**
 * Dynamic Sitemap Generator for kartis.info
 * Automatically generates sitemap.xml with all public pages and events
 *
 * Next.js will automatically serve this at /sitemap.xml
 */

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SEO_CONFIG } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.siteUrl

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admin/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/admin/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    // Fetch all active events with their school information
    const events = await prisma.event.findMany({
      where: {
        status: 'OPEN', // Only open events
        startAt: {
          gte: new Date(), // Only future events
        },
        school: {
          isActive: true, // Only events from active schools
        },
      },
      select: {
        slug: true,
        updatedAt: true,
        startAt: true,
        school: {
          select: {
            slug: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    })

    // Generate event pages with correct path: /p/[schoolSlug]/[eventSlug]
    const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${baseUrl}/p/${event.school.slug}/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...eventPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if database query fails
    return staticPages
  }
}
