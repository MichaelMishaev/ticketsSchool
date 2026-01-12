'use client'

import { useEffect } from 'react'
import {
  initScrollDepthTracking,
  initTimeOnPageTracking,
  initVisibilityTracking,
} from '@/lib/analytics'

/**
 * EngagementTracker Component
 *
 * Automatically tracks user engagement metrics on all pages:
 * - Scroll depth (25%, 50%, 75%, 100%)
 * - Time on page (10s, 30s, 60s, 2min, 5min)
 * - Page visibility (tab switching)
 *
 * This component should be added to the root layout.
 * All tracking is passive and doesn't affect performance.
 *
 * Benefits:
 * - Improves average engagement time metric in GA4
 * - Provides insights into content consumption
 * - Helps identify where users drop off
 */
export default function EngagementTracker() {
  useEffect(() => {
    // Initialize all engagement trackers
    const cleanupScroll = initScrollDepthTracking()
    const cleanupTime = initTimeOnPageTracking()
    const cleanupVisibility = initVisibilityTracking()

    // Cleanup on unmount (route change)
    return () => {
      cleanupScroll?.()
      cleanupTime?.()
      cleanupVisibility?.()
    }
  }, []) // Run once on mount

  // This component doesn't render anything
  return null
}
