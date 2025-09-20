'use client'

import { X, Calendar, Users, Clock, TrendingUp, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface DrilldownModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any
  type: 'activeEvents' | 'registrations' | 'waitlist' | 'occupancy'
}

export default function DrilldownModal({ isOpen, onClose, title, data, type }: DrilldownModalProps) {
  if (!isOpen) return null

  const renderActiveEvents = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{data?.count || 0}</div>
          <div className="text-blue-700">סה"כ אירועים פעילים</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {data?.events?.reduce((sum: number, event: any) => sum + event.availableSpots, 0) || 0}
          </div>
          <div className="text-green-700">מקומות זמינים</div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data?.events?.map((event: any) => (
          <div key={event.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">{event.confirmedCount}</div>
                  <div className="text-xs text-gray-500">מאושר</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-orange-600">{event.waitlistCount}</div>
                  <div className="text-xs text-gray-500">רשימת המתנה</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">{event.availableSpots}</div>
                  <div className="text-xs text-gray-500">זמין</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">{event.occupancyRate}%</div>
                  <div className="text-xs text-gray-500">תפוסה</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRegistrations = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{data?.totalRegistrations || 0}</div>
          <div className="text-blue-700">סה"כ הרשמות</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{data?.totalSpots || 0}</div>
          <div className="text-green-700">סה"כ מקומות</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">הרשמות אחרונות</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data?.recentRegistrations?.map((reg: any) => (
            <div key={reg.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{reg.confirmationCode}</div>
                <div className="text-xs text-gray-500">{reg.email}</div>
                <div className="text-xs text-gray-500">{reg.event.title}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{reg.spotsCount} מקומות</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(reg.createdAt), 'dd/MM HH:mm', { locale: he })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">פילוח לפי אירוע</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data?.byEvent?.map((eventData: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{eventData.event.title}</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(eventData.event.startAt), 'dd/MM/yyyy', { locale: he })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{eventData.registrations.length} הרשמות</div>
                <div className="text-xs text-gray-500">{eventData.totalSpots} מקומות</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderWaitlist = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">{data?.totalWaitlist || 0}</div>
          <div className="text-orange-700">ברשימת המתנה</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">{data?.totalSpots || 0}</div>
          <div className="text-yellow-700">סה"כ מקומות</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">רשימת המתנה (לפי סדר הגעה)</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data?.recentWaitlist?.map((reg: any) => (
            <div key={reg.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">
                    #{reg.position}
                  </span>
                  <span className="font-medium text-sm">{reg.confirmationCode}</span>
                </div>
                <div className="text-xs text-gray-500">{reg.email}</div>
                <div className="text-xs text-gray-500">{reg.event.title}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{reg.spotsCount} מקומות</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(reg.createdAt), 'dd/MM HH:mm', { locale: he })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">פילוח לפי אירוע</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data?.byEvent?.map((eventData: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{eventData.event.title}</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(eventData.event.startAt), 'dd/MM/yyyy', { locale: he })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{eventData.registrations.length} ממתינים</div>
                <div className="text-xs text-gray-500">{eventData.totalSpots} מקומות</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderOccupancy = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">{data?.overallOccupancyRate || 0}%</div>
          <div className="text-purple-700">תפוסה כללית</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{data?.totalConfirmed || 0}</div>
          <div className="text-blue-700">מקומות תפוסים</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{data?.totalAvailable || 0}</div>
          <div className="text-green-700">מקומות זמינים</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-lg font-bold text-gray-900">{data?.statistics?.averageOccupancy || 0}%</div>
          <div className="text-gray-700 text-sm">ממוצע תפוסה</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-lg font-bold text-red-900">{data?.statistics?.fullEvents || 0}</div>
          <div className="text-red-700 text-sm">אירועים מלאים</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-lg font-bold text-gray-900">{data?.statistics?.emptyEvents || 0}</div>
          <div className="text-gray-700 text-sm">אירועים ריקים</div>
        </div>
      </div>

      <div className="space-y-4">
        {data?.highOccupancyEvents?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">אירועים עם תפוסה גבוהה (80%+)</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.highOccupancyEvents.map((event: any) => (
                <div key={event.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(event.startAt), 'dd/MM/yyyy', { locale: he })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">{event.occupancyRate}%</div>
                    <div className="text-xs text-gray-500">{event.confirmedCount}/{event.capacity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.lowOccupancyEvents?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">אירועים עם תפוסה נמוכה (&lt;50%)</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.lowOccupancyEvents.map((event: any) => (
                <div key={event.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(event.startAt), 'dd/MM/yyyy', { locale: he })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-yellow-600">{event.occupancyRate}%</div>
                    <div className="text-xs text-gray-500">{event.confirmedCount}/{event.capacity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (type) {
      case 'activeEvents':
        return renderActiveEvents()
      case 'registrations':
        return renderRegistrations()
      case 'waitlist':
        return renderWaitlist()
      case 'occupancy':
        return renderOccupancy()
      default:
        return <div>No data available</div>
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}