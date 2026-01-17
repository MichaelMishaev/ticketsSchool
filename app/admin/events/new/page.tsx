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
  typography,
  buttonVariants,
  buttonSizes,
  inputVariants,
  cardVariants,
  badgeVariants,
} from '@/lib/design-tokens'
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
  CreditCard,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  Tag,
  AlignLeft,
} from 'lucide-react'

const AUTOSAVE_KEY = 'eventFormDraft'
const AUTOSAVE_INTERVAL = 10000 // 10 seconds

export default function NewEventPage() {
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

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    conditions: false,
    completionMessage: false,
    customFields: false,
    payment: false,
  })

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
    // Payment settings (Tier 2: Event Ticketing - YaadPay)
    paymentRequired: false,
    paymentTiming: 'OPTIONAL',
    pricingModel: 'FREE',
    priceAmount: undefined,
    currency: 'ILS',
  })

  // String inputs for better UX on number fields
  const [capacityInput, setCapacityInput] = useState('50')
  const [maxSpotsInput, setMaxSpotsInput] = useState('1')

  // Character limits
  const CHAR_LIMITS = {
    title: 100,
    description: 500,
    conditions: 500,
    completionMessage: 300,
  }

  // Wizard steps
  const steps = [
    { id: 'details', title: 'פרטים בסיסיים', description: 'מידע על האירוע' },
    { id: 'timing', title: 'תאריך ושעה', description: 'מתי האירוע מתקיים' },
    { id: 'capacity', title: 'כמות משתתפים', description: 'מגבלות הרשמה' },
    { id: 'advanced', title: 'הגדרות נוספות', description: 'אופציונלי' },
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
      setCapacityInput(String(draftData.formData.capacity || 50))
      setMaxSpotsInput(String(draftData.formData.maxSpotsPerPerson || 1))
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

      case 'startAt':
        if (typeof value === 'string' && value) {
          const selectedDateTime = new Date(value)
          const now = new Date()
          if (selectedDateTime < now) {
            errors.startAt = 'לא ניתן לבחור תאריך ושעה שעברו'
          }
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
    // When enabling payment, auto-switch from FREE to FIXED_PRICE
    if (name === 'paymentRequired' && value === true && formData.pricingModel === 'FREE') {
      setFormData((prev) => ({ ...prev, [name]: value, pricingModel: 'FIXED_PRICE' }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (typeof value !== 'boolean') {
      validateField(name, value)
    }
  }

  // Handle capacity input change
  const handleCapacityChange = (value: string) => {
    if (value === '') {
      setCapacityInput('')
      return
    }

    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(1, numValue)
      setCapacityInput(String(clampedValue))
      setFormData((prev) => ({ ...prev, capacity: clampedValue }))
      validateField('capacity', clampedValue)
    }
  }

  // Handle max spots input change
  const handleMaxSpotsChange = (value: string) => {
    if (value === '') {
      setMaxSpotsInput('')
      return
    }

    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(1, Math.min(10, numValue))
      setMaxSpotsInput(String(clampedValue))
      setFormData((prev) => ({ ...prev, maxSpotsPerPerson: clampedValue }))
      validateField('maxSpotsPerPerson', clampedValue)
    }
  }

  // Handle blur - ensure valid values
  const handleCapacityBlur = () => {
    if (capacityInput === '' || formData.capacity < 1) {
      setCapacityInput('1')
      setFormData((prev) => ({ ...prev, capacity: 1 }))
      validateField('capacity', 1)
    }
  }

  const handleMaxSpotsBlur = () => {
    if (maxSpotsInput === '' || formData.maxSpotsPerPerson < 1) {
      setMaxSpotsInput('1')
      setFormData((prev) => ({ ...prev, maxSpotsPerPerson: 1 }))
      validateField('maxSpotsPerPerson', 1)
    }
  }

  // Auto-select text on focus for easy replacement
  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
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
        // Also check that startAt is not in the past
        if (formData.startAt) {
          const selectedDateTime = new Date(formData.startAt)
          const now = new Date()
          if (selectedDateTime < now) {
            return false
          }
        }
        return formData.startAt !== '' && !validationErrors.endAt && !validationErrors.startAt
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

    // Validate startAt is not in the past
    const selectedDateTime = new Date(formData.startAt)
    const now = new Date()
    if (selectedDateTime < now) {
      addToast('לא ניתן ליצור אירוע עם תאריך ושעה שעברו', 'error')
      return
    }

    // Validate payment fields
    if (formData.paymentRequired) {
      // When payment is required, pricing model can only be FIXED_PRICE or PER_GUEST
      // Both require a price amount
      if (!formData.priceAmount || formData.priceAmount <= 0) {
        addToast('יש להזין מחיר חיובי כאשר האירוע בתשלום', 'error')
        return
      }
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

  // Toggle expandable section
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Character counter component
  const CharCounter = ({ current, max }: { current: number; max: number }) => {
    const percentage = (current / max) * 100
    const isNearLimit = percentage > 80
    const isOverLimit = current > max

    return (
      <div className="flex items-center gap-2 text-xs mt-1">
        <span
          className={`
          ${isOverLimit ? 'text-red-600 font-medium' : ''}
          ${isNearLimit && !isOverLimit ? 'text-amber-600' : ''}
          ${!isNearLimit ? 'text-gray-500' : ''}
        `}
        >
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

  // Info tooltip component
  const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-flex">
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  )

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step-0-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Step Introduction Card */}
            <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={typography.h4 + ' mb-2'}>שלב 1: פרטי האירוע</h2>
                  <p className={typography.bodySmall + ' text-gray-600'}>
                    מלא את המידע הבסיסי על האירוע שלך. שדות המסומנים ב-
                    <span className="text-red-600 font-bold">*</span> הם חובה.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Details Card */}
            <div className={cardVariants.default + ' p-6'}>
              <div className="space-y-6">
                {/* Game Type - First and Most Important */}
                <div>
                  <label
                    htmlFor="gameType"
                    className={typography.label + ' mb-2 flex items-center gap-2'}
                  >
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span>סוג האירוע</span>
                    <span className="text-red-500">*</span>
                    <InfoTooltip text="בחר את הקטגוריה המתאימה ביותר לאירוע שלך (לדוגמה: כדורגל, הרצאה, טיול, מסיבה)" />
                  </label>
                  <input
                    id="gameType"
                    type="text"
                    required
                    value={formData.gameType}
                    onChange={(e) => handleChange('gameType', e.target.value)}
                    className={
                      validationErrors.gameType ? inputVariants.error : inputVariants.default
                    }
                    placeholder="לדוגמה: כדורגל, כדורסל, טיול, הרצאה"
                    aria-invalid={!!validationErrors.gameType}
                    aria-describedby={
                      validationErrors.gameType ? 'gameType-error gameType-help' : 'gameType-help'
                    }
                  />
                  {validationErrors.gameType ? (
                    <p
                      id="gameType-error"
                      className="text-sm text-red-600 flex items-center gap-1 mt-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.gameType}
                    </p>
                  ) : (
                    <p id="gameType-help" className={typography.micro + ' mt-2'}>
                      הקטגוריה תעזור למשתתפים למצוא את האירוע שלך
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className={typography.label + ' mb-2 flex items-center gap-2'}
                  >
                    <AlignLeft className="w-4 h-4 text-blue-600" />
                    <span>כותרת האירוע</span>
                    <span className="text-red-500">*</span>
                    <InfoTooltip text="כותרת תיאורית וממוקדת שמסבירה על מה מדובר. למשל: 'משחק כדורגל נגד בית ספר ירושלים'" />
                  </label>
                  <input
                    id="title"
                    ref={titleInputRef}
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={validationErrors.title ? inputVariants.error : inputVariants.default}
                    placeholder="למשל: משחק כדורגל נגד בית ספר ירושלים"
                    maxLength={CHAR_LIMITS.title}
                    aria-invalid={!!validationErrors.title}
                    aria-describedby={validationErrors.title ? 'title-error' : undefined}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {validationErrors.title && (
                      <p id="title-error" className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {validationErrors.title}
                      </p>
                    )}
                    <div className="flex-1" />
                    <CharCounter current={formData.title?.length ?? 0} max={CHAR_LIMITS.title} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className={typography.label + ' mb-2 flex items-center gap-2'}
                  >
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span>תיאור מפורט</span>
                    <span className={badgeVariants.neutral + ' text-xs'}>אופציונלי</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className={
                      validationErrors.description ? inputVariants.error : inputVariants.default
                    }
                    rows={4}
                    placeholder="פרט על האירוע - מה יקרה, מה צריך להביא, מי מוזמן..."
                    maxLength={CHAR_LIMITS.description}
                    aria-invalid={!!validationErrors.description}
                    aria-describedby={
                      validationErrors.description ? 'description-error' : undefined
                    }
                  />
                  <div className="flex items-center justify-between mt-1">
                    {validationErrors.description && (
                      <p
                        id="description-error"
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {validationErrors.description}
                      </p>
                    )}
                    <div className="flex-1" />
                    <CharCounter
                      current={formData.description?.length ?? 0}
                      max={CHAR_LIMITS.description}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className={typography.label + ' mb-2 flex items-center gap-2'}
                  >
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span>מיקום</span>
                    <span className={badgeVariants.neutral + ' text-xs'}>אופציונלי</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className={inputVariants.default + ' pl-4 pr-12'}
                      placeholder="למשל: אולם ספורט, מגרש כדורגל ראשי"
                    />
                  </div>
                  <p className={typography.micro + ' mt-2'}>
                    ציין את המקום המדויק בו יתקיים האירוע
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            {(formData.gameType || formData.title) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-2 border-green-200 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={typography.labelSmall + ' text-green-900 mb-1'}>תצוגה מקדימה</p>
                    <p className={typography.bodySmall + ' text-green-800'}>
                      {formData.gameType && (
                        <span className="font-semibold">{formData.gameType}</span>
                      )}
                      {formData.gameType && formData.title && ' - '}
                      {formData.title && <span>{formData.title}</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
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
            {/* Step Introduction Card */}
            <div className="bg-gradient-to-l from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={typography.h4 + ' mb-2'}>שלב 2: תאריך ושעה</h2>
                  <p className={typography.bodySmall + ' text-gray-600'}>
                    קבע מתי האירוע שלך יתקיים. תאריך ההתחלה הוא חובה, תאריך הסיום אופציונלי.
                  </p>
                </div>
              </div>
            </div>

            {/* Timing Card */}
            <div className={cardVariants.default + ' p-6'}>
              <div className="space-y-6">
                {/* Start Date/Time */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <label className={typography.label}>
                      תאריך ושעת התחלה
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <InfoTooltip text="בחר את התאריך והשעה המדויקים בהם האירוע מתחיל" />
                  </div>
                  <DateTimePicker
                    value={formData.startAt}
                    onChange={(value) => handleChange('startAt', value)}
                    label=""
                    required
                  />
                  <p className={typography.micro + ' mt-2'}>זהו המועד בו ייפתח האירוע למשתתפים</p>
                </div>

                {/* End Date/Time */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <label className={typography.label}>
                      תאריך ושעת סיום
                      <span className={badgeVariants.neutral + ' text-xs mr-2'}>אופציונלי</span>
                    </label>
                    <InfoTooltip text="אם האירוע נמשך מספר שעות, ציין מתי הוא מסתיים (לא חובה)" />
                  </div>
                  <DateTimePicker
                    value={formData.endAt || ''}
                    onChange={(value) => handleChange('endAt', value)}
                    label=""
                    error={validationErrors.endAt}
                    minDate={formData.startAt ? formData.startAt.split('T')[0] : undefined}
                  />
                  {validationErrors.endAt && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.endAt}
                    </p>
                  )}
                </div>

                {/* Duration Summary */}
                {formData.startAt && formData.endAt && !validationErrors.endAt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className={typography.labelSmall + ' text-blue-900'}>משך האירוע מוגדר</p>
                        <p className={typography.micro + ' text-blue-700 mt-0.5'}>
                          האירוע יימשך מ-
                          {new Date(formData.startAt).toLocaleString('he-IL', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          עד{' '}
                          {new Date(formData.endAt).toLocaleString('he-IL', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
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
            {/* Step Introduction Card */}
            <div className="bg-gradient-to-l from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600 rounded-lg flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={typography.h4 + ' mb-2'}>שלב 3: כמות משתתפים</h2>
                  <p className={typography.bodySmall + ' text-gray-600'}>
                    הגדר כמה אנשים יכולים להירשם לאירוע ומה המגבלה להרשמה אחת.
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity Card */}
            <div className={cardVariants.default + ' p-6'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Capacity */}
                <div>
                  <label
                    htmlFor="capacity"
                    className={typography.label + ' mb-3 flex items-center gap-2'}
                  >
                    <Users className="w-4 h-4 text-green-600" />
                    <span>מספר מקומות כולל</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <input
                      id="capacity"
                      type="number"
                      required
                      min="1"
                      value={capacityInput}
                      onChange={(e) => handleCapacityChange(e.target.value)}
                      onBlur={handleCapacityBlur}
                      onFocus={handleNumberFocus}
                      className={
                        validationErrors.capacity
                          ? inputVariants.error + ' pl-4 pr-12 text-lg font-semibold'
                          : inputVariants.default + ' pl-4 pr-12 text-lg font-semibold'
                      }
                      aria-invalid={!!validationErrors.capacity}
                      aria-describedby={
                        validationErrors.capacity ? 'capacity-error capacity-help' : 'capacity-help'
                      }
                    />
                  </div>
                  {validationErrors.capacity ? (
                    <p
                      id="capacity-error"
                      className="text-sm text-red-600 flex items-center gap-1 mt-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.capacity}
                    </p>
                  ) : (
                    <p id="capacity-help" className={typography.micro + ' mt-2'}>
                      המספר הכולל של משתתפים שיכולים להירשם
                    </p>
                  )}
                </div>

                {/* Max Spots Per Person */}
                <div>
                  <label
                    htmlFor="maxSpots"
                    className={typography.label + ' mb-3 flex items-center gap-2'}
                  >
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span>מקסימום מקומות לנרשם</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <input
                      id="maxSpots"
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={maxSpotsInput}
                      onChange={(e) => handleMaxSpotsChange(e.target.value)}
                      onBlur={handleMaxSpotsBlur}
                      onFocus={handleNumberFocus}
                      className={
                        validationErrors.maxSpotsPerPerson
                          ? inputVariants.error + ' pl-4 pr-12 text-lg font-semibold'
                          : inputVariants.default + ' pl-4 pr-12 text-lg font-semibold'
                      }
                      aria-invalid={!!validationErrors.maxSpotsPerPerson}
                      aria-describedby={
                        validationErrors.maxSpotsPerPerson
                          ? 'maxSpots-error maxSpots-help'
                          : 'maxSpots-help'
                      }
                    />
                  </div>
                  {validationErrors.maxSpotsPerPerson ? (
                    <p
                      id="maxSpots-error"
                      className="text-sm text-red-600 flex items-center gap-1 mt-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.maxSpotsPerPerson}
                    </p>
                  ) : (
                    <p id="maxSpots-help" className={typography.micro + ' mt-2'}>
                      כמה מקומות יכול נרשם אחד להזמין (1-10)
                    </p>
                  )}
                </div>
              </div>

              {/* Capacity Example */}
              {formData.capacity > 0 && formData.maxSpotsPerPerson > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={typography.labelSmall + ' text-amber-900 mb-1'}>דוגמה</p>
                      <p className={typography.bodySmall + ' text-amber-800'}>
                        עם {formData.capacity} מקומות כולל ומקסימום {formData.maxSpotsPerPerson}{' '}
                        מקומות לנרשם, לפחות{' '}
                        {Math.ceil(formData.capacity / formData.maxSpotsPerPerson)} אנשים יצטרכו
                        להירשם כדי למלא את האירוע.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
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
            {/* Step Introduction Card */}
            <div className="bg-gradient-to-l from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-600 rounded-lg flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={typography.h4 + ' mb-2'}>שלב 4: הגדרות נוספות</h2>
                  <p className={typography.bodySmall + ' text-gray-600'}>
                    כל ההגדרות בשלב זה הן אופציונליות. אפשר לדלג ולסיים את יצירת האירוע.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Fields - Expandable */}
            <div className={cardVariants.default + ' overflow-hidden'}>
              <button
                type="button"
                onClick={() => toggleSection('customFields')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-600" />
                  <div className="text-right">
                    <h3 className={typography.h5}>שדות נוספים להרשמה</h3>
                    <p className={typography.micro + ' text-gray-600 mt-1'}>
                      הוסף שדות מותאמים אישית (שם, טלפון, גיל וכו')
                    </p>
                  </div>
                </div>
                {expandedSections.customFields ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.customFields && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-6">
                      <FieldBuilder
                        fields={formData.fieldsSchema}
                        onChange={(fields) => setFormData({ ...formData, fieldsSchema: fields })}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Conditions - Expandable */}
            <div className={cardVariants.default + ' overflow-hidden'}>
              <button
                type="button"
                onClick={() => toggleSection('conditions')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="text-right">
                    <h3 className={typography.h5}>תנאי השתתפות</h3>
                    <p className={typography.micro + ' text-gray-600 mt-1'}>
                      הגדר תנאים והגבלות לאירוע (גיל, ביגוד וכו')
                    </p>
                  </div>
                </div>
                {expandedSections.conditions ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.conditions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-6 space-y-4">
                      <div>
                        <label htmlFor="conditions" className={typography.label + ' mb-2'}>
                          תנאי השתתפות
                        </label>
                        <textarea
                          id="conditions"
                          value={formData.conditions}
                          onChange={(e) => handleChange('conditions', e.target.value)}
                          className={
                            validationErrors.conditions
                              ? inputVariants.error
                              : inputVariants.default
                          }
                          rows={4}
                          placeholder="לדוגמה: האירוע מיועד לגילאי 10-16 בלבד, חובה להביא נעלי ספורט..."
                          maxLength={CHAR_LIMITS.conditions}
                          aria-invalid={!!validationErrors.conditions}
                          aria-describedby={
                            validationErrors.conditions ? 'conditions-error' : undefined
                          }
                        />
                        <div className="flex items-center justify-between mt-1">
                          {validationErrors.conditions && (
                            <p
                              id="conditions-error"
                              className="text-sm text-red-600 flex items-center gap-1"
                            >
                              <AlertCircle className="w-4 h-4" />
                              {validationErrors.conditions}
                            </p>
                          )}
                          <div className="flex-1" />
                          <CharCounter
                            current={formData.conditions?.length ?? 0}
                            max={CHAR_LIMITS.conditions}
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-colors border-2 border-gray-200">
                        <input
                          type="checkbox"
                          checked={formData.requireAcceptance}
                          onChange={(e) => handleChange('requireAcceptance', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 hover:border-gray-400 transition-colors cursor-pointer"
                        />
                        <span className={typography.bodySmall + ' font-medium'}>
                          דרוש אישור תנאי השתתפות בעת ההרשמה
                        </span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Completion Message - Expandable */}
            <div className={cardVariants.default + ' overflow-hidden'}>
              <button
                type="button"
                onClick={() => toggleSection('completionMessage')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div className="text-right">
                    <h3 className={typography.h5}>הודעה לנרשמים</h3>
                    <p className={typography.micro + ' text-gray-600 mt-1'}>
                      הודעה מותאמת אישית שתוצג לאחר השלמת ההרשמה
                    </p>
                  </div>
                </div>
                {expandedSections.completionMessage ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.completionMessage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-6">
                      <label htmlFor="completionMessage" className={typography.label + ' mb-2'}>
                        הודעת אישור
                      </label>
                      <textarea
                        id="completionMessage"
                        value={formData.completionMessage}
                        onChange={(e) => handleChange('completionMessage', e.target.value)}
                        className={
                          validationErrors.completionMessage
                            ? inputVariants.error
                            : inputVariants.default
                        }
                        rows={4}
                        placeholder="לדוגמה: מעולה! נרשמת בהצלחה למשחק. נתראה ביום חמישי בשעה 16:00!"
                        maxLength={CHAR_LIMITS.completionMessage}
                        aria-invalid={!!validationErrors.completionMessage}
                        aria-describedby={
                          validationErrors.completionMessage ? 'completion-error' : undefined
                        }
                      />
                      <div className="flex items-center justify-between mt-1">
                        {validationErrors.completionMessage && (
                          <p
                            id="completion-error"
                            className="text-sm text-red-600 flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {validationErrors.completionMessage}
                          </p>
                        )}
                        <div className="flex-1" />
                        <CharCounter
                          current={formData.completionMessage?.length ?? 0}
                          max={CHAR_LIMITS.completionMessage}
                        />
                      </div>
                      <p className={typography.micro + ' mt-2'}>
                        ההודעה תוצג למשתתפים מיד לאחר שיסיימו את ההרשמה
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Payment Configuration - Expandable */}
            <div className={cardVariants.default + ' overflow-hidden'}>
              <button
                type="button"
                onClick={() => toggleSection('payment')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <div className="text-right">
                    <h3 className={typography.h5}>הגדרות תשלום</h3>
                    <p className={typography.micro + ' text-gray-600 mt-1'}>
                      הפוך את האירוע לאירוע בתשלום דרך YaadPay
                    </p>
                  </div>
                </div>
                {expandedSections.payment ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.payment && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-6 space-y-6">
                      {/* Payment Required Toggle */}
                      <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-colors border-2 border-gray-200">
                        <input
                          type="checkbox"
                          checked={formData.paymentRequired}
                          onChange={(e) => handleChange('paymentRequired', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 hover:border-gray-400 transition-colors cursor-pointer"
                        />
                        <span className={typography.bodySmall + ' font-medium'}>
                          דרוש תשלום לאירוע זה
                        </span>
                      </label>

                      {/* Conditional: Payment Settings */}
                      {formData.paymentRequired && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6"
                        >
                          {/* Payment Timing */}
                          <div>
                            <label htmlFor="paymentTiming" className={typography.label + ' mb-2'}>
                              מועד התשלום <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="paymentTiming"
                              value={formData.paymentTiming}
                              onChange={(e) => handleChange('paymentTiming', e.target.value)}
                              className={inputVariants.default}
                            >
                              <option value="UPFRONT">תשלום מראש (לפני ההרשמה) - מומלץ</option>
                              <option value="POST_REGISTRATION">
                                תשלום לאחר ההרשמה (קבלת חשבונית במייל)
                              </option>
                              <option value="OPTIONAL">אופציונלי (ניתן לשלם או לא)</option>
                            </select>
                            <p className={typography.micro + ' mt-2'}>
                              {formData.paymentTiming === 'UPFRONT' &&
                                'המשתתף ישלם לפני השלמת ההרשמה דרך YaadPay'}
                              {formData.paymentTiming === 'POST_REGISTRATION' &&
                                'המשתתף יקבל קישור לתשלום במייל לאחר ההרשמה'}
                              {formData.paymentTiming === 'OPTIONAL' &&
                                'המשתתף יוכל לבחור האם לשלם או לא'}
                            </p>
                          </div>

                          {/* Pricing Model */}
                          <div>
                            <label htmlFor="pricingModel" className={typography.label + ' mb-2'}>
                              מודל תמחור <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="pricingModel"
                              value={formData.pricingModel}
                              onChange={(e) => handleChange('pricingModel', e.target.value)}
                              className={inputVariants.default}
                            >
                              <option value="FIXED_PRICE">מחיר קבוע להרשמה</option>
                              <option value="PER_GUEST">מחיר לכל אורח (טבלאות)</option>
                            </select>
                            <p className={typography.micro + ' mt-2'}>
                              {formData.pricingModel === 'FIXED_PRICE' &&
                                'מחיר קבוע לכל הרשמה, ללא קשר למספר אורחים'}
                              {formData.pricingModel === 'PER_GUEST' &&
                                'המחיר מחושב לפי מספר האורחים (מחיר × מספר אורחים)'}
                            </p>
                          </div>

                          {/* Price Amount (only if not FREE) */}
                          {formData.pricingModel !== 'FREE' && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <label htmlFor="priceAmount" className={typography.label + ' mb-2'}>
                                מחיר {formData.pricingModel === 'PER_GUEST' ? 'לאורח' : 'להרשמה'}{' '}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500 pointer-events-none z-10">
                                  ₪
                                </span>
                                <input
                                  id="priceAmount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.priceAmount || ''}
                                  onChange={(e) => {
                                    const value = e.target.value ? parseFloat(e.target.value) : 0
                                    setFormData((prev) => ({
                                      ...prev,
                                      priceAmount: value || undefined,
                                    }))
                                  }}
                                  className={inputVariants.default + ' pl-4 pr-12'}
                                  placeholder="50.00"
                                />
                              </div>
                              <p className={typography.micro + ' mt-2'}>
                                מחיר בשקלים חדשים (₪). לדוגמה: 50.00 לאירוע של 50 שקל
                              </p>
                              {formData.priceAmount && (
                                <div className="mt-3 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                                  <p
                                    className={typography.bodySmall + ' text-green-800 font-medium'}
                                  >
                                    💰 מחיר מוצג:{' '}
                                    <span className="text-lg">
                                      ₪{formData.priceAmount.toFixed(2)}
                                    </span>
                                    {formData.pricingModel === 'PER_GUEST' && ' לאורח'}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}

                          {/* Currency Info */}
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">מטבע: שקל חדש (₪ ILS)</p>
                                <p className={typography.micro + ' text-blue-700'}>
                                  כרגע המערכת תומכת רק בתשלומים בשקלים דרך YaadPay. תמיכה במטבעות
                                  נוספים תתווסף בעתיד.
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
      <EventPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        eventData={formData}
      />
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
              label: 'התחל מחדש',
              onClick: handleDiscardDraft,
              variant: 'secondary',
              icon: <AlertCircle className="w-5 h-5" />,
            },
            {
              label: 'טען טיוטה',
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
                  <p className={typography.labelSmall + ' text-blue-900 mb-1'}>זמן שמירה</p>
                  <p className={typography.micro + ' text-blue-700'}>
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
                  <p className={typography.labelSmall + ' text-gray-900'}>תצוגה מקדימה של הטיוטה</p>
                </div>

                <div className="space-y-2 text-sm">
                  {draftData.formData.gameType && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[80px]">סוג אירוע:</span>
                      <span className="text-gray-900 font-medium">
                        {draftData.formData.gameType}
                      </span>
                    </div>
                  )}
                  {draftData.formData.title && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[80px]">כותרת:</span>
                      <span className="text-gray-900 font-medium truncate">
                        {draftData.formData.title}
                      </span>
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
          </div>
        </Modal>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className={typography.h1 + ' flex items-center gap-3 mb-2'}>
                <Zap className="w-8 h-8 text-blue-600" />
                יצירת אירוע חדש
              </h1>
              <p className={typography.bodySmall + ' text-gray-600'}>
                מלא את הפרטים בשלבים הבאים. השדות המסומנים ב-
                <span className="text-red-600 font-bold">*</span> הם חובה.
              </p>
            </div>

            {/* Action buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={saveDraft}
                className={buttonVariants.ghost + ' ' + buttonSizes.md}
                title="Ctrl+S"
              >
                <Save className="w-4 h-4" />
                <span>שמור טיוטה</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!formData.title}
                className={buttonVariants.secondary + ' ' + buttonSizes.md}
                title="Ctrl+P"
              >
                <Eye className="w-4 h-4" />
                <span>תצוגה מקדימה</span>
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
                נשמר אוטומטית ב-
                {lastSavedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
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

          {/* Navigation Buttons - Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex mt-8 justify-between gap-4"
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
                className={buttonVariants.ghost + ' ' + buttonSizes.md}
              >
                ביטול
              </button>

              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isLoading}
                  className={buttonVariants.secondary + ' ' + buttonSizes.md}
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
                  className={buttonVariants.primary + ' ' + buttonSizes.lg}
                >
                  <span>המשך</span>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    isLoading || Object.values(validationErrors).some((error) => error !== '')
                  }
                  className={
                    buttonVariants.success + ' ' + buttonSizes.lg + ' shadow-lg hover:shadow-xl'
                  }
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

          {/* Navigation Buttons - Mobile (Fixed Bottom Bar) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-40">
            <div className="max-w-4xl mx-auto">
              {currentStep < steps.length - 1 ? (
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={isLoading}
                      className={buttonVariants.ghost + ' ' + buttonSizes.lg + ' flex-1'}
                    >
                      <ArrowRight className="w-5 h-5" />
                      <span>חזור</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      nextStep()
                    }}
                    disabled={!validateStep(currentStep)}
                    className={buttonVariants.primary + ' ' + buttonSizes.lg + ' flex-1'}
                  >
                    <span>המשך לשלב הבא</span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={
                    isLoading || Object.values(validationErrors).some((error) => error !== '')
                  }
                  className={buttonVariants.success + ' ' + buttonSizes.lg + ' w-full shadow-lg'}
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
          </div>

          {/* Keyboard shortcuts hint - Desktop only */}
          <div className="hidden md:block mt-4 text-center text-xs text-gray-500">
            <p>קיצורי מקלדת: Ctrl+S לשמירה | Ctrl+P לתצוגה מקדימה</p>
          </div>
        </form>
      </div>
    </>
  )
}
