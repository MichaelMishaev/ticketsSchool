'use client'

import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Edit } from 'lucide-react'

interface CompactEventHeroProps {
  event: {
    id: string
    title: string
    status: 'OPEN' | 'PAUSED' | 'CLOSED'
    slug: string
    startAt: Date
    endAt: Date | null
    location: string | null
    gameType: string | null
    description: string | null
    school: {
      slug: string
    }
  }
  onEdit?: () => void
}

export default function CompactEventHero({ event, onEdit }: CompactEventHeroProps) {
  const router = useRouter()

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      router.push(`/admin/events/${event.id}/edit`)
    }
  }

  // Status badge styling (semantic colors)
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OPEN':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          text: 'text-white',
          label: 'פעיל',
        }
      case 'PAUSED':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-white',
          label: 'מושהה',
        }
      case 'CLOSED':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          text: 'text-white',
          label: 'סגור',
        }
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-white',
          label: status,
        }
    }
  }

  const statusConfig = getStatusConfig(event.status)

  // Format date in Hebrew
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }

  // Format time only
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <header className="bg-white border-b border-gray-200" role="banner" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Title Row - Title, Status Badge, and Edit Button - Single Line */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight flex-1 min-w-0 truncate">
            {event.title}
          </h1>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Badge - Compact */}
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}
            >
              {statusConfig.label}
            </span>

            {/* Edit Button - Icon only, minimal */}
            <button
              onClick={handleEdit}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg
                       hover:bg-gray-200 hover:text-gray-900
                       active:scale-95 transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="ערוך אירוע"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Event Details - Inline compact layout */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{formatDate(event.startAt)}</span>
            <span className="text-blue-600 font-semibold">| {formatTime(event.startAt)}</span>
          </div>

          {/* Location - Always show, with fallback */}
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className={`w-4 h-4 ${event.location ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className={event.location ? 'font-medium' : 'text-gray-400 text-sm'}>
              {event.location || 'לא הוגדר מיקום'}
            </span>
          </div>

          {/* Game Type Badge - Inline */}
          {event.gameType && (
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
              {event.gameType}
            </span>
          )}
        </div>

        {/* Description - Only if exists, very compact */}
        {event.description && (
          <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </header>
  )
}
