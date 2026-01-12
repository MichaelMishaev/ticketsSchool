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
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
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
