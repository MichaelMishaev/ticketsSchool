import { useState, useEffect, useCallback } from 'react'

interface Registration {
  id: string
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
  spotsCount: number
  phoneNumber: string
  data: Record<string, unknown>
  confirmationCode: string
  createdAt: string
}

interface Stats {
  confirmed: number
  waitlist: number
  cancelled: number
}

interface EventStreamData {
  type: 'connected' | 'new_registration' | 'stats_update' | 'heartbeat'
  timestamp?: string
  registration?: Registration
  stats?: Stats
}

interface UseEventStreamReturn {
  newRegistrations: Registration[]
  isConnected: boolean
  stats: Stats | null
  clearNewRegistrations: () => void
}

/**
 * Custom hook for Server-Sent Events (SSE) connection to real-time registration updates
 *
 * Manages EventSource connection to the SSE endpoint and handles incoming events.
 * Automatically reconnects on disconnect with exponential backoff.
 *
 * @param eventId - The ID of the event to stream updates for
 * @param enabled - Whether to enable the stream (default: true)
 * @returns Object containing new registrations, connection status, and stats
 *
 * @example
 * ```tsx
 * const { newRegistrations, isConnected, stats } = useEventStream(eventId)
 *
 * // Merge with existing registrations
 * const allRegistrations = [...newRegistrations, ...existingRegistrations]
 * ```
 */
export function useEventStream(
  eventId: string,
  enabled: boolean = true
): UseEventStreamReturn {
  const [newRegistrations, setNewRegistrations] = useState<Registration[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  const clearNewRegistrations = useCallback(() => {
    setNewRegistrations([])
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !eventId) {
      return
    }

    // Check if EventSource is supported
    if (!window.EventSource) {
      console.warn('EventSource not supported, real-time updates disabled')
      return
    }

    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | undefined

    const connect = () => {
      try {
        // Create EventSource connection
        eventSource = new EventSource(`/api/events/${eventId}/stream`)

        eventSource.onopen = () => {
          console.log('SSE connected')
          setIsConnected(true)
          setReconnectAttempt(0) // Reset reconnect counter on successful connection
        }

        eventSource.onmessage = (event) => {
          try {
            const data: EventStreamData = JSON.parse(event.data)

            switch (data.type) {
              case 'connected':
                console.log('SSE connection established at', data.timestamp)
                break

              case 'new_registration':
                if (data.registration) {
                  console.log('New registration received:', data.registration.id)

                  // Add to beginning of array (most recent first)
                  setNewRegistrations((prev) => {
                    // Prevent duplicates
                    if (prev.some(r => r.id === data.registration!.id)) {
                      return prev
                    }
                    return [data.registration!, ...prev]
                  })

                  // Play notification sound (optional - user preference)
                  if (typeof Audio !== 'undefined') {
                    try {
                      // Simple success beep
                      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBj2Z2/LFdCkGJH3J8tyJNwgZbrzt4ploFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNwgZbrzt4phoFQxMqOPuuGIcBjiP1vLMeSwFJ3zJ8tyJNw==')
                      audio.volume = 0.3
                      audio.play().catch(() => {
                        // Ignore errors if audio playback fails
                      })
                    } catch {
                      // Audio not supported or failed, continue silently
                    }
                  }
                }
                break

              case 'stats_update':
                if (data.stats) {
                  setStats(data.stats)
                }
                break

              case 'heartbeat':
                // Keep-alive heartbeat, no action needed
                break

              default:
                console.warn('Unknown SSE message type:', data.type)
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error)
          }
        }

        eventSource.onerror = () => {
          console.error('SSE connection error, attempting reconnect...')
          setIsConnected(false)

          if (eventSource) {
            eventSource.close()
          }

          // Exponential backoff: 1s, 2s, 4s, 8s, max 16s
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempt), 16000)
          console.log(`Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttempt + 1})`)

          reconnectTimeout = setTimeout(() => {
            setReconnectAttempt(prev => prev + 1)
            connect()
          }, backoffDelay)
        }
      } catch (error) {
        console.error('Failed to create EventSource:', error)
        setIsConnected(false)
      }
    }

    // Initial connection
    connect()

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [eventId, enabled, reconnectAttempt])

  return {
    newRegistrations,
    isConnected,
    stats,
    clearNewRegistrations
  }
}
