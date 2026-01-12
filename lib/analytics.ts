/**
 * Google Analytics event tracking utilities
 *
 * GA4 Event Categories:
 * - user_action: User interactions (button clicks, form submissions)
 * - event_management: Event creation, editing, deletion
 * - registration: Registration flow events
 * - authentication: Login, signup, logout
 * - engagement: Help button, navigation, time on page
 */

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, any>) => void
  }
}

export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  additionalParams?: Record<string, any>
}

/**
 * Track a custom event in Google Analytics
 * Only tracks if GA is loaded and measurement ID is configured
 */
export function trackEvent({
  action,
  category,
  label,
  value,
  additionalParams,
}: AnalyticsEvent): void {
  // Only track in browser environment
  if (typeof window === 'undefined') return

  // Check if gtag is loaded
  if (!window.gtag) {
    console.debug('GA not loaded, skipping event:', action)
    return
  }

  // Check if measurement ID is configured
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    console.debug('GA measurement ID not configured, skipping event:', action)
    return
  }

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...additionalParams,
    })

    console.debug('GA Event tracked:', { action, category, label, value })
  } catch (error) {
    console.error('Failed to track GA event:', error)
  }
}

/**
 * Pre-defined tracking functions for common events
 */

// Event Management
export const trackEventCreated = (eventName: string, eventType: string) => {
  trackEvent({
    action: 'event_created',
    category: 'event_management',
    label: eventType,
    additionalParams: {
      event_name: eventName,
    },
  })
}

export const trackEventEdited = (eventId: string) => {
  trackEvent({
    action: 'event_edited',
    category: 'event_management',
    label: eventId,
  })
}

export const trackEventDeleted = (eventId: string) => {
  trackEvent({
    action: 'event_deleted',
    category: 'event_management',
    label: eventId,
  })
}

// Registration Flow
export const trackRegistrationStarted = (eventSlug: string) => {
  trackEvent({
    action: 'registration_started',
    category: 'registration',
    label: eventSlug,
  })
}

export const trackRegistrationCompleted = (
  eventSlug: string,
  ticketCount: number,
  status: 'confirmed' | 'waitlist'
) => {
  trackEvent({
    action: 'registration_completed',
    category: 'registration',
    label: eventSlug,
    value: ticketCount,
    additionalParams: {
      registration_status: status,
    },
  })
}

export const trackRegistrationFailed = (eventSlug: string, error: string) => {
  trackEvent({
    action: 'registration_failed',
    category: 'registration',
    label: eventSlug,
    additionalParams: {
      error_message: error,
    },
  })
}

// Authentication
export const trackLogin = (method: 'email' | 'google') => {
  trackEvent({
    action: 'login',
    category: 'authentication',
    label: method,
  })
}

export const trackSignup = (method: 'email' | 'google') => {
  trackEvent({
    action: 'signup',
    category: 'authentication',
    label: method,
  })
}

export const trackLogout = () => {
  trackEvent({
    action: 'logout',
    category: 'authentication',
  })
}

// User Engagement
export const trackHelpButtonClick = (page: string) => {
  trackEvent({
    action: 'help_button_click',
    category: 'engagement',
    label: page,
  })
}

export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent({
    action: 'button_click',
    category: 'user_action',
    label: buttonName,
    additionalParams: {
      location,
    },
  })
}

export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent({
    action: success ? 'form_submitted' : 'form_error',
    category: 'user_action',
    label: formName,
  })
}

// Navigation
export const trackPageView = (pagePath: string, pageTitle: string) => {
  trackEvent({
    action: 'page_view',
    category: 'engagement',
    label: pagePath,
    additionalParams: {
      page_title: pageTitle,
    },
  })
}

export const trackExternalLinkClick = (url: string) => {
  trackEvent({
    action: 'external_link_click',
    category: 'engagement',
    label: url,
  })
}

export const trackWhatsAppHelpClick = (page: string) => {
  trackEvent({
    action: 'whatsapp_help_click',
    category: 'engagement',
    label: page,
  })
}

// ============================================================================
// ENHANCED ENGAGEMENT TRACKING
// ============================================================================

/**
 * Scroll Depth Tracking
 * Tracks when users scroll to 25%, 50%, 75%, and 100% of page
 * Helps measure content engagement and identify where users drop off
 */
export const initScrollDepthTracking = () => {
  if (typeof window === 'undefined') return

  const scrollDepths = [25, 50, 75, 100]
  const triggered = new Set<number>()
  let ticking = false

  const checkScrollDepth = () => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY || document.documentElement.scrollTop

    const scrollPercent = Math.round(((scrollTop + windowHeight) / documentHeight) * 100)

    scrollDepths.forEach((depth) => {
      if (scrollPercent >= depth && !triggered.has(depth)) {
        triggered.add(depth)
        trackEvent({
          action: 'scroll_depth',
          category: 'engagement',
          label: `${depth}%`,
          value: depth,
          additionalParams: {
            page_path: window.location.pathname,
          },
        })
      }
    })

    ticking = false
  }

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(checkScrollDepth)
      ticking = true
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })

  // Cleanup function
  return () => {
    window.removeEventListener('scroll', onScroll)
  }
}

/**
 * Time on Page Tracking
 * Tracks user engagement at 10s, 30s, 60s, 120s intervals
 * Critical for improving average engagement time metric
 */
export const initTimeOnPageTracking = () => {
  if (typeof window === 'undefined') return

  const intervals = [
    { seconds: 10, label: '10s' },
    { seconds: 30, label: '30s' },
    { seconds: 60, label: '60s' },
    { seconds: 120, label: '2min' },
    { seconds: 300, label: '5min' },
  ]

  const timers: NodeJS.Timeout[] = []

  intervals.forEach(({ seconds, label }) => {
    const timer = setTimeout(() => {
      trackEvent({
        action: 'time_on_page',
        category: 'engagement',
        label,
        value: seconds,
        additionalParams: {
          page_path: window.location.pathname,
        },
      })
    }, seconds * 1000)

    timers.push(timer)
  })

  // Cleanup function
  return () => {
    timers.forEach((timer) => clearTimeout(timer))
  }
}

/**
 * Page Visibility Tracking
 * Tracks when users switch tabs or minimize browser
 * Helps identify distraction points and real engagement
 */
export const initVisibilityTracking = () => {
  if (typeof window === 'undefined') return

  let hiddenTime = 0
  let lastHiddenTimestamp: number | null = null

  const handleVisibilityChange = () => {
    if (document.hidden) {
      lastHiddenTimestamp = Date.now()
      trackEvent({
        action: 'page_hidden',
        category: 'engagement',
        label: window.location.pathname,
      })
    } else {
      if (lastHiddenTimestamp) {
        const timeHidden = Math.round((Date.now() - lastHiddenTimestamp) / 1000)
        hiddenTime += timeHidden

        trackEvent({
          action: 'page_visible',
          category: 'engagement',
          label: window.location.pathname,
          value: timeHidden,
          additionalParams: {
            total_hidden_time: hiddenTime,
          },
        })
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

/**
 * Click Interaction Tracking
 * Tracks clicks on important interactive elements
 * Helps identify popular features and user journey
 */
export const trackInteractiveClick = (
  elementType: string,
  elementLabel: string,
  additionalData?: Record<string, any>
) => {
  trackEvent({
    action: 'interactive_click',
    category: 'engagement',
    label: `${elementType}: ${elementLabel}`,
    additionalParams: {
      element_type: elementType,
      element_label: elementLabel,
      page_path: window.location.pathname,
      ...additionalData,
    },
  })
}

/**
 * 404 Error Tracking
 * Tracks which URLs are resulting in 404 errors
 * Critical for identifying broken links and fixing them
 */
export const track404Error = (attemptedUrl: string, referrer?: string) => {
  trackEvent({
    action: '404_error',
    category: 'error',
    label: attemptedUrl,
    additionalParams: {
      attempted_url: attemptedUrl,
      referrer: referrer || document.referrer,
      user_agent: navigator.userAgent,
    },
  })
}

/**
 * Form Field Interaction Tracking
 * Tracks when users interact with specific form fields
 * Helps identify where users drop off in forms
 */
export const trackFormFieldInteraction = (
  formName: string,
  fieldName: string,
  action: 'focus' | 'blur' | 'change'
) => {
  trackEvent({
    action: `form_field_${action}`,
    category: 'engagement',
    label: `${formName} - ${fieldName}`,
    additionalParams: {
      form_name: formName,
      field_name: fieldName,
    },
  })
}

/**
 * Search Tracking
 * Tracks internal site searches
 * Helps understand what users are looking for
 */
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    value: resultsCount,
    additionalParams: {
      search_term: searchTerm,
      results_count: resultsCount,
    },
  })
}

/**
 * Video/Media Interaction Tracking
 * Tracks video plays, pauses, and completion
 */
export const trackMediaInteraction = (
  mediaType: 'video' | 'audio' | 'image',
  action: 'play' | 'pause' | 'complete' | 'view',
  mediaName: string,
  progress?: number
) => {
  trackEvent({
    action: `media_${action}`,
    category: 'engagement',
    label: `${mediaType}: ${mediaName}`,
    value: progress,
    additionalParams: {
      media_type: mediaType,
      media_name: mediaName,
      progress_percent: progress,
    },
  })
}

/**
 * Download Tracking
 * Tracks file downloads (PDFs, images, etc.)
 */
export const trackDownload = (fileName: string, fileType: string) => {
  trackEvent({
    action: 'download',
    category: 'engagement',
    label: fileName,
    additionalParams: {
      file_name: fileName,
      file_type: fileType,
    },
  })
}

/**
 * Tab/Section Navigation Tracking
 * Tracks navigation between tabs or sections within a page
 */
export const trackTabChange = (tabName: string, fromTab?: string, location?: string) => {
  trackEvent({
    action: 'tab_change',
    category: 'engagement',
    label: tabName,
    additionalParams: {
      from_tab: fromTab,
      to_tab: tabName,
      location: location || window.location.pathname,
    },
  })
}

/**
 * Error Tracking (General)
 * Tracks JavaScript errors and exceptions
 */
export const trackError = (errorMessage: string, errorStack?: string, fatal: boolean = false) => {
  trackEvent({
    action: 'error',
    category: 'error',
    label: errorMessage,
    additionalParams: {
      error_message: errorMessage,
      error_stack: errorStack,
      fatal,
      page_path: window.location.pathname,
    },
  })
}
