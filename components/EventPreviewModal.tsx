'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { EventFormData } from '@/types'
import { format } from 'date-fns'

interface EventPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  eventData: EventFormData
}

export default function EventPreviewModal({ isOpen, onClose, eventData }: EventPreviewModalProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const availableSpots = eventData.capacity || 0
  const spotsPerPerson = eventData.maxSpotsPerPerson || 1

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl z-50"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">תצוגה מקדימה</h2>
                  <p className="text-blue-100 text-sm mt-1">כך האירוע ייראה למשתתפים</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="סגור תצוגה מקדימה"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content - scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Title */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {eventData.title || 'כותרת האירוע'}
                    </h1>
                    {eventData.gameType && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {eventData.gameType}
                      </span>
                    )}
                  </div>

                  {/* Key Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date/Time */}
                    {eventData.startAt && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-blue-600 mb-1">מתי?</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatDate(eventData.startAt)}
                            </div>
                            {eventData.endAt && (
                              <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                עד {formatDate(eventData.endAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {eventData.location && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-green-600 mb-1">איפה?</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {eventData.location}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Capacity */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <div className="text-xs font-medium text-purple-600 mb-1">מקומות זמינים</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {availableSpots} מקומות
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            עד {spotsPerPerson} מקומות לנרשם
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {eventData.description && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">על האירוע</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {eventData.description}
                      </p>
                    </div>
                  )}

                  {/* Conditions */}
                  {eventData.conditions && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <h3 className="text-sm font-semibold text-gray-900">תנאי השתתפות</h3>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mr-7">
                        {eventData.conditions}
                      </p>
                      {eventData.requireAcceptance && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 mr-7">
                          <CheckCircle className="w-4 h-4" />
                          נדרש אישור תנאים בעת ההרשמה
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Fields Preview */}
                  {eventData.fieldsSchema && eventData.fieldsSchema.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">שדות נוספים בהרשמה</h3>
                      <div className="space-y-3">
                        {eventData.fieldsSchema.map((field, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {field.label}
                                {field.required && <span className="text-red-500 mr-1">*</span>}
                              </span>
                              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                                {field.type === 'text' && 'טקסט'}
                                {field.type === 'number' && 'מספר'}
                                {field.type === 'dropdown' && 'בחירה'}
                                {field.type === 'checkbox' && 'סימון'}
                              </span>
                            </div>
                            {field.placeholder && (
                              <p className="text-xs text-gray-500">{field.placeholder}</p>
                            )}
                            {field.options && field.options.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {field.options.map((option, optIdx) => (
                                  <span key={optIdx} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completion Message */}
                  {eventData.completionMessage && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-start gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <h3 className="text-sm font-semibold text-gray-900">הודעה לאחר ההרשמה</h3>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mr-7">
                        {eventData.completionMessage}
                      </p>
                    </div>
                  )}

                  {/* Mock Registration Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      disabled
                      className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg opacity-50 cursor-not-allowed"
                    >
                      הרשמה לאירוע (תצוגה בלבד)
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      זוהי תצוגה מקדימה - הכפתור אינו פעיל
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
