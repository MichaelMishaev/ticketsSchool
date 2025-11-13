'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import FieldBuilder, { defaultFields } from '@/components/field-builder'
import { EventFormData } from '@/types'
import { useToast } from '@/components/Toast'
import StepWizard from '@/components/StepWizard'
import EventPreviewModal from '@/components/EventPreviewModal'
import DateTimePicker from '@/components/DateTimePicker'
import Modal from '@/components/Modal'
import { trackEventCreated } from '@/lib/analytics'
import {
  Calendar,
  MapPin,
  Users,
  UserCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  Eye,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Clock,
  Database,
  Zap,
} from 'lucide-react'

const AUTOSAVE_KEY = 'eventFormDraft'
const AUTOSAVE_INTERVAL = 10000 // 10 seconds

export default function NewEventPageTest() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftData, setDraftData] = useState<any>(null)
  const { addToast, ToastContainer } = useToast()
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    gameType: '',
    location: '',
    startAt: '',
    endAt: '',
    capacity: 50,
    maxSpotsPerPerson: 1,
    fieldsSchema: defaultFields,
    conditions: '',
    requireAcceptance: false,
    completionMessage: '',
  })

  // Character limits
  const CHAR_LIMITS = {
    title: 100,
    description: 500,
    conditions: 500,
    completionMessage: 300,
  }

  // Wizard steps
  const steps = [
    { id: 'details', title: 'פרטים', description: 'מידע בסיסי' },
    { id: 'timing', title: 'תזמון', description: 'תאריכים ושעות' },
    { id: 'capacity', title: 'מקומות', description: 'כמויות ומגבלות' },
    { id: 'advanced', title: 'מתקדם', description: 'תנאים ושדות' },
  ]

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(AUTOSAVE_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setDraftData(parsed)
        setShowDraftModal(true)
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [])

  // Handle draft recovery
  const handleLoadDraft = () => {
    if (draftData) {
      setFormData(draftData.formData)
      setCurrentStep(draftData.currentStep || 0)
      setCompletedSteps(new Set(draftData.completedSteps || []))
      setShowDraftModal(false)
      addToast('טיוטה נטענה בהצלחה', 'success', 3000)
    }
  }

  const handleDiscardDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY)
    setDraftData(null)
    setShowDraftModal(false)
    addToast('טיוטה נמחקה', 'info', 2000)
  }

  // Autosave to localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && formData.title) {
        try {
          localStorage.setItem(
            AUTOSAVE_KEY,
            JSON.stringify({
              formData,
              currentStep,
              completedSteps: Array.from(completedSteps),
              savedAt: new Date().toISOString(),
            })
          )
          setLastSavedAt(new Date())
        } catch (error) {
          console.error('Autosave failed:', error)
        }
      }
    }, AUTOSAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [formData, currentStep, completedSteps, hasUnsavedChanges])

  // Track form changes
  useEffect(() => {
    const hasChanges =
      formData.title !== '' ||
      formData.description !== '' ||
      formData.gameType !== '' ||
      formData.location !== ''

    setHasUnsavedChanges(hasChanges)
  }, [formData])

  // Warn on page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveDraft()
      }
      // Ctrl/Cmd + P to preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setShowPreview(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formData])

  // Real-time validation
  const validateField = (name: string, value: string | number) => {
    const errors: Record<string, string> = {}

    switch (name) {
      case 'title':
        if (typeof value === 'string' && value.length > CHAR_LIMITS.title) {
          errors.title = `כותרת ארוכה מדי (מקסימום ${CHAR_LIMITS.title} תווים)`
        } else if (typeof value === 'string' && value.length < 3 && value.length > 0) {
          errors.title = 'כותרת קצרה מדי (מינימום 3 תווים)'
        }
        break

      case 'gameType':
        if (typeof value === 'string' && value.length === 0) {
          errors.gameType = 'סוג אירוע הוא שדה חובה'
        } else if (typeof value === 'string' && value.length < 2 && value.length > 0) {
          errors.gameType = 'סוג אירוע קצר מדי (מינימום 2 תווים)'
        }
        break

      case 'description':
        if (typeof value === 'string' && value.length > CHAR_LIMITS.description) {
          errors.description = `תיאור ארוך מדי (מקסימום ${CHAR_LIMITS.description} תווים)`
        }
        break

      case 'conditions':
        if (typeof value === 'string' && value.length > CHAR_LIMITS.conditions) {
          errors.conditions = `תנאים ארוכים מדי (מקסימום ${CHAR_LIMITS.conditions} תווים)`
        }
        break

      case 'completionMessage':
        if (typeof value === 'string' && value.length > CHAR_LIMITS.completionMessage) {
          errors.completionMessage = `הודעה ארוכה מדי (מקסימום ${CHAR_LIMITS.completionMessage} תווים)`
        }
        break

      case 'endAt':
        if (typeof value === 'string' && formData.startAt && value) {
          if (new Date(value) <= new Date(formData.startAt)) {
            errors.endAt = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה'
          }
        }
        break

      case 'capacity':
        if (typeof value === 'number' && value < 1) {
          errors.capacity = 'מספר המקומות חייב להיות לפחות 1'
        }
        break

      case 'maxSpotsPerPerson':
        if (typeof value === 'number' && (value < 1 || value > 10)) {
          errors.maxSpotsPerPerson = 'מספר המקומות למשתתף חייב להיות בין 1 ל-10'
        }
        break
    }

    setValidationErrors((prev) => ({
      ...prev,
      ...errors,
      ...(Object.keys(errors).length === 0 ? { [name]: '' } : {}),
    }))
  }

  const handleChange = (name: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (typeof value !== 'boolean') {
      validateField(name, value)
    }
  }

  const saveDraft = () => {
    try {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({
          formData,
          currentStep,
          completedSteps: Array.from(completedSteps),
          savedAt: new Date().toISOString(),
        })
      )
      setLastSavedAt(new Date())
      addToast('טיוטה נשמרה בהצלחה', 'success', 2000)
    } catch (error) {
      addToast('שגיאה בשמירת טיוטה', 'error')
    }
  }

  const clearDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY)
    setLastSavedAt(null)
  }

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Details
        return (
          formData.title.length >= 3 &&
          (formData.gameType?.length ?? 0) >= 2 &&
          !validationErrors.title &&
          !validationErrors.gameType
        )
      case 1: // Timing
        return formData.startAt !== '' && !validationErrors.endAt
      case 2: // Capacity
        return formData.capacity >= 1 && formData.maxSpotsPerPerson >= 1
      case 3: // Advanced
        return true // Optional step
      default:
        return true
    }
  }

  const goToStep = (stepIndex: number) => {
    // Can only go to completed steps or next step
    if (completedSteps.has(stepIndex) || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex)
    }
  }

  const nextStep = () => {
    console.log('[nextStep] Called. Current step:', currentStep)

    // Prevent advancing if already on last step
    if (currentStep >= steps.length - 1) {
      console.log('[nextStep] Already on last step, not advancing')
      return
    }

    // Trigger validation for empty required fields before checking
    if (currentStep === 0) {
      if (!formData.gameType) {
        validateField('gameType', '')
      }
      if (!formData.title) {
        validateField('title', '')
      }
    }

    if (validateStep(currentStep)) {
      console.log('[nextStep] Validation passed, advancing to step', currentStep + 1)
      setCompletedSteps((prev) => new Set(prev).add(currentStep))
      setCurrentStep((prev) => prev + 1)
    } else {
      console.log('[nextStep] Validation failed')
      addToast('אנא השלם את כל השדות הנדרשים', 'error')
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[handleSubmit] Called! Current step:', currentStep)
    console.log('[handleSubmit] Should only be called on step 3 (index 3)')

    // Prevent submission if not on final step
    if (currentStep < steps.length - 1) {
      console.error('[handleSubmit] ERROR: Form submitted before final step!')
      console.error('[handleSubmit] Current step:', currentStep, 'Expected:', steps.length - 1)
      addToast('שגיאה: אנא השלם את כל השלבים', 'error')
      return
    }

    // Final validation
    if (Object.values(validationErrors).some((error) => error !== '')) {
      addToast('אנא תקן את השגיאות בטופס', 'error')
      return
    }

    if (!formData.gameType || formData.gameType.length < 2) {
      addToast('סוג אירוע הוא שדה חובה', 'error')
      return
    }

    if (!formData.startAt) {
      addToast('תאריך התחלה הוא שדה חובה', 'error')
      return
    }

    setIsLoading(true)

    try {
      // Convert datetime-local strings to ISO strings with timezone
      const payload = {
        ...formData,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const event = await response.json()

        // Track event creation in Google Analytics
        trackEventCreated(formData.title, formData.gameType || 'general')

        setShowSuccess(true)
        clearDraft()
        setHasUnsavedChanges(false)

        // Wait for success animation, then navigate
        setTimeout(() => {
          router.push(`/admin/events/${event.id}`)
        }, 2500)
      } else {
        const errorData = await response.json()
        addToast(errorData.error || 'שגיאה ביצירת האירוע', 'error')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      addToast('שגיאה לא צפויה. אנא נסה שוב', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Character counter component
  const CharCounter = ({ current, max }: { current: number; max: number }) => {
    const percentage = (current / max) * 100
    const isNearLimit = percentage > 80
    const isOverLimit = current > max

    return (
      <div className="flex items-center gap-2 text-xs mt-1">
        <span className={`
          ${isOverLimit ? 'text-red-600 font-medium' : ''}
          ${isNearLimit && !isOverLimit ? 'text-amber-600' : ''}
          ${!isNearLimit ? 'text-gray-500' : ''}
        `}>
          {current} / {max}
        </span>
        {isOverLimit && (
          <span className="text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            חריגה מהמגבלה
          </span>
        )}
      </div>
    )
  }

  // Input wrapper with icon
  const InputWithIcon = ({
    icon: Icon,
    error,
    children,
  }: {
    icon: any
    error?: string
    children: React.ReactNode
  }) => {
    return (
      <div className="relative">
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
          <Icon className="w-5 h-5" />
        </div>
        {children}
      </div>
    )
  }

  // Success animation overlay
  const SuccessOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-green-500 to-emerald-600 z-[9999] flex items-center justify-center"
    >
      <div className="text-center text-white">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
        >
          <CheckCircle2 className="w-32 h-32 mx-auto mb-6" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-2"
        >
          האירוע נוצר בהצלחה!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-green-100"
        >
          מעביר לדף האירוע...
        </motion.p>
        <motion.div
          className="mt-8"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Sparkles className="w-12 h-12 mx-auto animate-pulse" />
        </motion.div>
      </div>
    </motion.div>
  )

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">פרטי האירוע</h2>
              </div>

              {/* Game Type - NOW FIRST */}
              <div className="mb-6">
                <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 mb-2">
                  סוג אירוע <span className="text-red-500">*</span>
                </label>
                <input
                  id="gameType"
                  type="text"
                  required
                  value={formData.gameType}
                  onChange={(e) => handleChange('gameType', e.target.value)}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-400 transition-all
                    ${validationErrors.gameType ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="כדורגל, כדורסל, טיול, הרצאה, מסיבה..."
                  aria-invalid={!!validationErrors.gameType}
                  aria-describedby={validationErrors.gameType ? 'gameType-error gameType-help' : 'gameType-help'}
                />
                {validationErrors.gameType ? (
                  <span id="gameType-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.gameType}
                  </span>
                ) : (
                  <p id="gameType-help" className="text-xs text-gray-500 mt-1">
                    קטגוריה של האירוע (לדוגמה: כדורגל, הרצאה, טיול)
                  </p>
                )}
              </div>

              {/* Title - NOW SECOND */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  כותרת האירוע <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  ref={titleInputRef}
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg text-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-400 transition-all
                    ${validationErrors.title ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="משחק כדורגל נגד בית ספר..."
                  maxLength={CHAR_LIMITS.title}
                  aria-invalid={!!validationErrors.title}
                  aria-describedby={validationErrors.title ? 'title-error' : undefined}
                />
                <div className="flex items-center justify-between">
                  {validationErrors.title && (
                    <span id="title-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.title}
                    </span>
                  )}
                  <div className="flex-1" />
                  <CharCounter current={formData.title?.length ?? 0} max={CHAR_LIMITS.title} />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  תיאור
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-400 transition-all
                    ${validationErrors.description ? 'border-red-500' : 'border-gray-300'}
                  `}
                  rows={5}
                  placeholder="תאר את האירוע בפירוט..."
                  maxLength={CHAR_LIMITS.description}
                  aria-invalid={!!validationErrors.description}
                  aria-describedby={validationErrors.description ? 'description-error' : undefined}
                />
                <div className="flex items-center justify-between">
                  {validationErrors.description && (
                    <span id="description-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.description}
                    </span>
                  )}
                  <div className="flex-1" />
                  <CharCounter current={formData.description?.length ?? 0} max={CHAR_LIMITS.description} />
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  מיקום
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all"
                    placeholder="אולם ספורט / מגרש..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            key="step-1-timing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">תזמון האירוע</h2>
              </div>

              {/* Start Date/Time */}
              <div className="mb-6">
                <DateTimePicker
                  value={formData.startAt}
                  onChange={(value) => handleChange('startAt', value)}
                  label="תאריך ושעת התחלה"
                  required
                />
              </div>

              {/* End Date/Time */}
              <div className="mb-6">
                <DateTimePicker
                  value={formData.endAt || ''}
                  onChange={(value) => handleChange('endAt', value)}
                  label="תאריך ושעת סיום (אופציונלי)"
                  error={validationErrors.endAt}
                  minDate={formData.startAt ? formData.startAt.split('T')[0] : undefined}
                />
              </div>

              {formData.startAt && formData.endAt && !validationErrors.endAt && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 text-blue-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">משך האירוע מוגדר בהצלחה</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step-2-capacity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">הגדרות כמות</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Capacity */}
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                    מספר מקומות כולל <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <input
                      id="capacity"
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                      className={`
                        w-full pl-4 pr-12 py-3 border-2 rounded-lg text-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400 transition-all
                        ${validationErrors.capacity ? 'border-red-500' : 'border-gray-300'}
                      `}
                      aria-invalid={!!validationErrors.capacity}
                      aria-describedby={validationErrors.capacity ? 'capacity-error' : undefined}
                    />
                  </div>
                  {validationErrors.capacity && (
                    <span id="capacity-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.capacity}
                    </span>
                  )}
                </div>

                {/* Max Spots Per Person */}
                <div>
                  <label htmlFor="maxSpots" className="block text-sm font-medium text-gray-700 mb-2">
                    מקסימום מקומות לנרשם <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <input
                      id="maxSpots"
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.maxSpotsPerPerson}
                      onChange={(e) => handleChange('maxSpotsPerPerson', parseInt(e.target.value) || 0)}
                      className={`
                        w-full pl-4 pr-12 py-3 border-2 rounded-lg text-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400 transition-all
                        ${validationErrors.maxSpotsPerPerson ? 'border-red-500' : 'border-gray-300'}
                      `}
                      aria-invalid={!!validationErrors.maxSpotsPerPerson}
                      aria-describedby={validationErrors.maxSpotsPerPerson ? 'maxSpots-error' : undefined}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    מספר המקומות המקסימלי שניתן להזמין בהרשמה אחת (בין 1 ל-10)
                  </p>
                  {validationErrors.maxSpotsPerPerson && (
                    <span id="maxSpots-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.maxSpotsPerPerson}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            key="step-3-advanced"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Field Builder */}
            {/* Custom Fields */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">שדות נוספים להרשמה</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                הוסף שדות מותאמים אישית שהמשתתפים יצטרכו למלא בעת ההרשמה (שם, טלפון, גיל וכו')
              </p>
              <FieldBuilder
                fields={formData.fieldsSchema}
                onChange={(fields) => setFormData({ ...formData, fieldsSchema: fields })}
              />
            </div>

            {/* Conditions */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">תנאים והגבלות</h2>

              <div className="mb-6">
                <label htmlFor="conditions" className="block text-sm font-medium text-gray-700 mb-2">
                  תנאי השתתפות
                </label>
                <textarea
                  id="conditions"
                  value={formData.conditions}
                  onChange={(e) => handleChange('conditions', e.target.value)}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-400 transition-all
                    ${validationErrors.conditions ? 'border-red-500' : 'border-gray-300'}
                  `}
                  rows={4}
                  placeholder="לדוגמה: האירוע מיועד לגילאי 10-16 בלבד..."
                  maxLength={CHAR_LIMITS.conditions}
                  aria-invalid={!!validationErrors.conditions}
                  aria-describedby={validationErrors.conditions ? 'conditions-error' : undefined}
                />
                <div className="flex items-center justify-between">
                  {validationErrors.conditions && (
                    <span id="conditions-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.conditions}
                    </span>
                  )}
                  <div className="flex-1" />
                  <CharCounter current={formData.conditions?.length ?? 0} max={CHAR_LIMITS.conditions} />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.requireAcceptance}
                  onChange={(e) => handleChange('requireAcceptance', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 hover:border-gray-400 transition-colors cursor-pointer"
                />
                <span className="text-sm text-gray-700 font-medium">דרוש אישור תנאי השתתפות בעת ההרשמה</span>
              </label>
            </div>

            {/* Completion Message */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">הודעה לנרשמים</h2>

              <div>
                <label htmlFor="completionMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  הודעה לאחר השלמת הרשמה
                </label>
                <textarea
                  id="completionMessage"
                  value={formData.completionMessage}
                  onChange={(e) => handleChange('completionMessage', e.target.value)}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-400 transition-all
                    ${validationErrors.completionMessage ? 'border-red-500' : 'border-gray-300'}
                  `}
                  rows={4}
                  placeholder="לדוגמה: מעולה! נרשמת בהצלחה..."
                  maxLength={CHAR_LIMITS.completionMessage}
                  aria-invalid={!!validationErrors.completionMessage}
                  aria-describedby={validationErrors.completionMessage ? 'completion-error' : undefined}
                />
                <div className="flex items-center justify-between">
                  {validationErrors.completionMessage && (
                    <span id="completion-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.completionMessage}
                    </span>
                  )}
                  <div className="flex-1" />
                  <CharCounter current={formData.completionMessage?.length ?? 0} max={CHAR_LIMITS.completionMessage} />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  ההודעה תוצג למשתתפים לאחר שיסיימו את תהליך ההרשמה בהצלחה.
                </p>
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <ToastContainer />
      <EventPreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} eventData={formData} />
      <AnimatePresence>{showSuccess && <SuccessOverlay />}</AnimatePresence>

      {/* Draft Recovery Modal */}
      {showDraftModal && draftData && (
        <Modal
          isOpen={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          title="נמצאה טיוטה שמורה"
          description="מצאנו טיוטה שמורה מהפעם האחרונה. האם ברצונך להמשיך מאיפה שעצרת?"
          icon={<Database className="w-8 h-8" />}
          size="lg"
          buttons={[
            {
              label: 'התחל מחדש ומחק טיוטה',
              onClick: handleDiscardDraft,
              variant: 'secondary',
              icon: <AlertCircle className="w-5 h-5" />,
            },
            {
              label: 'טען טיוטה והמשך לעבוד',
              onClick: handleLoadDraft,
              variant: 'primary',
              icon: <Database className="w-5 h-5" />,
            },
          ]}
        >
          <div className="space-y-4">
            {/* Draft Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 mb-1">זמן שמירה</p>
                  <p className="text-xs text-blue-700">
                    {draftData.savedAt
                      ? new Date(draftData.savedAt).toLocaleString('he-IL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'לא ידוע'}
                  </p>
                </div>
              </div>
            </div>

            {/* Draft Preview */}
            {draftData.formData && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">תצוגה מקדימה של הטיוטה</p>
                </div>

                <div className="space-y-2 text-sm">
                  {draftData.formData.gameType && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[80px]">סוג אירוע:</span>
                      <span className="text-gray-900 font-medium">{draftData.formData.gameType}</span>
                    </div>
                  )}
                  {draftData.formData.title && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[80px]">כותרת:</span>
                      <span className="text-gray-900 font-medium truncate">{draftData.formData.title}</span>
                    </div>
                  )}
                  {draftData.formData.location && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[80px]">מיקום:</span>
                      <span className="text-gray-900">{draftData.formData.location}</span>
                    </div>
                  )}
                  {draftData.formData.capacity && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[80px]">קיבולת:</span>
                      <span className="text-gray-900">{draftData.formData.capacity} משתתפים</span>
                    </div>
                  )}
                </div>

                {/* Step Progress */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Zap className="w-4 h-4" />
                    <span>
                      התקדמות: שלב {(draftData.currentStep || 0) + 1} מתוך {steps.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>שימו לב:</strong> בחירה ב"התחל מחדש" תמחק את הטיוטה לצמיתות. אם אתם לא בטוחים, בחרו
                  "טען טיוטה" - תוכלו תמיד למחוק אותה מאוחר יותר.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                יצירת אירוע חדש
              </h1>
              <p className="text-gray-600 mt-1">מערכת משופרת עם שמירה אוטומטית ותצוגה מקדימה</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveDraft}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Ctrl+S"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">שמור טיוטה</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!formData.title}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Ctrl+P"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">תצוגה מקדימה</span>
              </button>
            </div>
          </div>

          {/* Autosave indicator */}
          {lastSavedAt && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <Database className="w-4 h-4" />
              <span>
                נשמר אוטומטית ב-{lastSavedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Step Wizard */}
        <div className="mb-8">
          <StepWizard
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting form, but allow it in textareas and buttons
            if (
              e.key === 'Enter' &&
              e.target instanceof HTMLElement &&
              e.target.tagName !== 'BUTTON' &&
              e.target.tagName !== 'TEXTAREA'
            ) {
              e.preventDefault()
            }
          }}
        >
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col-reverse sm:flex-row justify-between gap-4"
          >
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (hasUnsavedChanges) {
                    const confirmed = confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לצאת?')
                    if (confirmed) {
                      router.back()
                    }
                  } else {
                    router.back()
                  }
                }}
                disabled={isLoading}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ביטול
              </button>

              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>חזור</span>
                </button>
              )}
            </div>

            <div>
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    nextStep()
                  }}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto justify-center"
                >
                  <span>המשך</span>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || Object.values(validationErrors).some((error) => error !== '')}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>יוצר אירוע...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>צור אירוע</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                יש לך שינויים שלא נשמרו. הטופס נשמר אוטומטית כל 10 שניות.
              </p>
            </motion.div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>קיצורי מקלדת: Ctrl+S לשמירה | Ctrl+P לתצוגה מקדימה</p>
          </div>
        </form>
      </div>
    </>
  )
}
