'use client'

interface EventHeroHeaderProps {
  event: {
    id: string
    title: string
    status: 'OPEN' | 'PAUSED' | 'CLOSED'
    slug: string
    school: {
      slug: string
    }
  }
}

export default function EventHeroHeader({ event }: EventHeroHeaderProps) {
  // Status badge styling (semantic colors)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'PAUSED':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CLOSED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'פעיל'
      case 'PAUSED':
        return 'מושהה'
      case 'CLOSED':
        return 'סגור'
      default:
        return status
    }
  }

  return (
    <header
      className="bg-gradient-to-b from-white via-gray-50/20 to-transparent border-b border-gray-200/80"
      role="banner"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Event Title + Status Only */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(event.status)}`}
          >
            {getStatusLabel(event.status)}
          </span>
        </div>
      </div>
    </header>
  )
}
