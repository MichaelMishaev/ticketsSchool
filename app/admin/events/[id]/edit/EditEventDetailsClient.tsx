'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import FieldBuilder, { defaultFields } from '@/components/field-builder'
import { EventFormData } from '@/types'
import { useToast } from '@/components/Toast'
import StepWizard from '@/components/StepWizard'
import DateTimePicker from '@/components/DateTimePicker'
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
  Clock,
  Database,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  DollarSign,
} from 'lucide-react'

interface EditEventDetailsClientProps {
  eventId: string
  eventTitle: string
  initialData: EventFormData & { status?: string }
}

export default function EditEventDetailsClient({
  eventId,
  eventTitle,
  initialData,
}: EditEventDetailsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([0, 1, 2, 3, 4]))
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { addToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState<EventFormData>(initialData)

  // String inputs for better UX on number fields
  const [capacityInput, setCapacityInput] = useState(String(initialData.capacity || 50))
  const [maxSpotsInput, setMaxSpotsInput] = useState(String(initialData.maxSpotsPerPerson || 1))
  const [priceInput, setPriceInput] = useState(String(initialData.priceAmount || ''))

  // Character limits
  const CHAR_LIMITS = {
    title: 100,
    description: 500,
    conditions: 500,
    completionMessage: 300,
  }

  // Wizard steps - Payment first for better conversion
  const steps = [
    { id: 'payment', title: 'תשלום', description: 'הגדרות תשלום' },
    { id: 'details', title: 'פרטים', description: 'מידע בסיסי' },
    { id: 'timing', title: 'תזמון', description: 'תאריכים ושעות' },
    { id: 'capacity', title: 'מקומות', description: 'כמויות ומגבלות' },
    { id: 'advanced', title: 'מתקדם', description: 'תנאים ושדות' },
  ]

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

      case 'priceAmount':
        if (typeof value === 'number' && value < 0) {
          errors.priceAmount = 'המחיר חייב להיות 0 או יותר'
        } else if (typeof value === 'number' && value > 100000) {
          errors.priceAmount = 'המחיר גבוה מדי (מקסימום 100,000 ₪)'
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

  // Handle price input change
  const handlePriceChange = (value: string) => {
    if (value === '') {
      setPriceInput('')
      setFormData((prev) => ({ ...prev, priceAmount: undefined }))
      return
    }

    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(100000, numValue))
      setPriceInput(String(clampedValue))
      setFormData((prev) => ({ ...prev, priceAmount: clampedValue }))
      validateField('priceAmount', clampedValue)
    }
  }

  const handlePriceBlur = () => {
    if (priceInput !== '' && formData.priceAmount !== undefined) {
      // Format to 2 decimal places
      const formatted = formData.priceAmount.toFixed(2)
      setPriceInput(formatted)
    }
  }

  // Auto-select text on focus for easy replacement
  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Payment (moved to first)
        // If payment required, must have timing, model, and amount
        if (formData.paymentRequired) {
          const hasValidPrice =
            formData.pricingModel === 'FREE' ||
            (formData.priceAmount !== undefined && formData.priceAmount > 0 && !validationErrors.priceAmount)
          return hasValidPrice
        }
        return true // Optional step
      case 1: // Details
        return (
          formData.title.length >= 3 &&
          (formData.gameType?.length ?? 0) >= 2 &&
          !validationErrors.title &&
          !validationErrors.gameType
        )
      case 2: // Timing
        return formData.startAt !== '' && !validationErrors.endAt
      case 3: // Capacity
        return formData.capacity >= 1 && formData.maxSpotsPerPerson >= 1
      case 4: // Advanced
        return true // Optional step
      default:
        return true
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const nextStep = () => {
    if (currentStep >= steps.length - 1) {
      return
    }

    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep))
      setCurrentStep((prev) => prev + 1)
    } else {
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

    // Prevent submission if not on final step
    if (currentStep < steps.length - 1) {
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

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        addToast('האירוע עודכן בהצלחה', 'success', 3000)

        // Navigate back to event details
        setTimeout(() => {
          router.push(`/admin/events/${eventId}`)
          router.refresh()
        }, 1000)
      } else {
        const errorData = await response.json()
        addToast(errorData.error || 'שגיאה בעדכון האירוע', 'error')
      }
    } catch (error) {
      console.error('Error updating event:', error)
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Payment (moved to first position)
        return (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Payment Settings Card */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">הגדרות תשלום</h2>
                  <p className="text-sm text-gray-600">הגדר אם האירוע דורש תשלום, מתי התשלום מתבצע, ומה המחיר</p>
                </div>
              </div>

              {/* Payment Timing - FIRST (as shown in screenshot) */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">מתי מתבצע התשלום?</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">
                      {formData.paymentRequired
                        ? (formData.paymentTiming === 'UPFRONT' ? 'תשלום מראש' : 'חשבונית לאחר')
                        : 'ללא תשלום'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Payment Timing Card 1 - No Payment (Free) - FIRST */}
                  <label
                    className={`
                      relative group cursor-pointer rounded-xl border-2 p-5 transition-all duration-300
                      ${
                        !formData.paymentRequired
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-4 ring-blue-100'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="paymentTiming"
                        value="NO_PAYMENT"
                        checked={!formData.paymentRequired}
                        onChange={() => {
                          handleChange('paymentRequired', false)
                        }}
                        className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-4 focus:ring-blue-200 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base font-bold text-gray-900">ללא תשלום</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          האירוע חינמי - אין צורך בתשלום
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {!formData.paymentRequired && (
                      <div className="absolute top-3 left-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Payment Timing Card 2 - Upfront */}
                  <label
                    className={`
                      relative group cursor-pointer rounded-xl border-2 p-5 transition-all duration-300
                      ${
                        formData.paymentTiming === 'UPFRONT' && formData.paymentRequired
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-4 ring-green-100'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="paymentTiming"
                        value="UPFRONT"
                        checked={formData.paymentTiming === 'UPFRONT'}
                        onChange={(e) => {
                          handleChange('paymentTiming', e.target.value)
                          if (!formData.paymentRequired) {
                            handleChange('paymentRequired', true)
                          }
                        }}
                        className="mt-1 w-5 h-5 text-green-600 border-2 border-gray-300 focus:ring-4 focus:ring-green-200 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base font-bold text-gray-900">תשלום מראש בעת ההרשמה</span>
                          {formData.paymentTiming === 'UPFRONT' && formData.paymentRequired && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                              מומלץ
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          המשתתף משלם בזמן ההרשמה לפני אישור המקום
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {formData.paymentTiming === 'UPFRONT' && formData.paymentRequired && (
                      <div className="absolute top-3 left-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Payment Timing Card 2 - Post Registration */}
                  <label
                    className={`
                      relative group cursor-pointer rounded-xl border-2 p-5 transition-all duration-300
                      ${
                        formData.paymentTiming === 'POST_REGISTRATION' && formData.paymentRequired
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-4 ring-green-100'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="paymentTiming"
                        value="POST_REGISTRATION"
                        checked={formData.paymentTiming === 'POST_REGISTRATION'}
                        onChange={(e) => {
                          handleChange('paymentTiming', e.target.value)
                          if (!formData.paymentRequired) {
                            handleChange('paymentRequired', true)
                          }
                        }}
                        className="mt-1 w-5 h-5 text-green-600 border-2 border-gray-300 focus:ring-4 focus:ring-green-200 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base font-bold text-gray-900">חשבונית לאחר האירוע</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          שליחת חשבונית לאחר סיום האירוע - תשלום מאוחר יותר
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {formData.paymentTiming === 'POST_REGISTRATION' && formData.paymentRequired && (
                      <div className="absolute top-3 left-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Pricing Model - Show when payment required */}
              <AnimatePresence>
                {formData.paymentRequired && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-sm font-medium text-gray-600">מודל תמחור</span>
                      </div>
                    </div>

                    {/* Pricing Model Selection */}
                    <div>
                      <label className="block text-lg font-bold text-gray-900 mb-4">
                        בחר את מודל התמחור <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Fixed Price */}
                        <label
                          className={`
                            relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300
                            ${
                              formData.pricingModel === 'FIXED_PRICE'
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-4 ring-blue-100'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="pricingModel"
                            value="FIXED_PRICE"
                            checked={formData.pricingModel === 'FIXED_PRICE'}
                            onChange={(e) => handleChange('pricingModel', e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="flex justify-center mb-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                formData.pricingModel === 'FIXED_PRICE' ? 'bg-blue-500' : 'bg-gray-200'
                              }`}>
                                <DollarSign className={`w-6 h-6 ${
                                  formData.pricingModel === 'FIXED_PRICE' ? 'text-white' : 'text-gray-500'
                                }`} />
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">מחיר קבוע</h4>
                            <p className="text-xs text-gray-600">מחיר אחד להרשמה</p>
                          </div>
                          {formData.pricingModel === 'FIXED_PRICE' && (
                            <div className="absolute -top-3 -right-3 z-10">
                              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </label>

                        {/* Per Guest */}
                        <label
                          className={`
                            relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300
                            ${
                              formData.pricingModel === 'PER_GUEST'
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-4 ring-blue-100'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="pricingModel"
                            value="PER_GUEST"
                            checked={formData.pricingModel === 'PER_GUEST'}
                            onChange={(e) => handleChange('pricingModel', e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="flex justify-center mb-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                formData.pricingModel === 'PER_GUEST' ? 'bg-blue-500' : 'bg-gray-200'
                              }`}>
                                <Users className={`w-6 h-6 ${
                                  formData.pricingModel === 'PER_GUEST' ? 'text-white' : 'text-gray-500'
                                }`} />
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">מחיר למשתתף</h4>
                            <p className="text-xs text-gray-600">מחיר כפול מספר מקומות</p>
                          </div>
                          {formData.pricingModel === 'PER_GUEST' && (
                            <div className="absolute -top-3 -right-3 z-10">
                              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </label>

                        {/* Free */}
                        <label
                          className={`
                            relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300
                            ${
                              formData.pricingModel === 'FREE'
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-4 ring-blue-100'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="pricingModel"
                            value="FREE"
                            checked={formData.pricingModel === 'FREE'}
                            onChange={(e) => handleChange('pricingModel', e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="flex justify-center mb-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                formData.pricingModel === 'FREE' ? 'bg-blue-500' : 'bg-gray-200'
                              }`}>
                                <CheckCircle2 className={`w-6 h-6 ${
                                  formData.pricingModel === 'FREE' ? 'text-white' : 'text-gray-500'
                                }`} />
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">חינמי</h4>
                            <p className="text-xs text-gray-600">ללא עלות</p>
                          </div>
                          {formData.pricingModel === 'FREE' && (
                            <div className="absolute -top-3 -right-3 z-10">
                              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Price Input - IMPROVED UX */}
                    <AnimatePresence mode="wait">
                      {formData.pricingModel !== 'FREE' && (
                        <motion.div
                          key="price-input"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          {/* Price Input - Compact & Mobile-Friendly */}
                          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
                            <label htmlFor="priceAmount" className="block text-base font-bold text-gray-900 mb-4">
                              {formData.pricingModel === 'PER_GUEST' ? 'מחיר לכל משתתף' : 'מחיר קבוע'}
                              <span className="text-red-500 mr-1">*</span>
                            </label>

                            {/* Price Input Field - Inline Currency */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="relative flex-1 max-w-xs">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg pointer-events-none select-none">
                                  ₪
                                </span>
                                <input
                                  id="priceAmount"
                                  type="text"
                                  inputMode="decimal"
                                  value={priceInput}
                                  onChange={(e) => {
                                    // Allow only numbers and decimal point
                                    const value = e.target.value.replace(/[^\d.]/g, '')
                                    handlePriceChange(value)
                                  }}
                                  onBlur={handlePriceBlur}
                                  onFocus={handleNumberFocus}
                                  className={`
                                    w-full pl-4 pr-12 py-3.5 border-2 rounded-xl text-lg font-semibold
                                    focus:ring-4 focus:ring-blue-200 focus:border-blue-500
                                    hover:border-gray-400 transition-all
                                    ${validationErrors.priceAmount ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
                                  `}
                                  placeholder="0.00"
                                  aria-label={formData.pricingModel === 'PER_GUEST' ? 'מחיר לכל משתתף' : 'מחיר קבוע'}
                                  aria-invalid={!!validationErrors.priceAmount}
                                  aria-describedby="price-help price-error"
                                />
                              </div>

                              {/* Live Preview Indicator */}
                              {formData.priceAmount !== undefined && formData.priceAmount > 0 && !validationErrors.priceAmount && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-300 rounded-lg"
                                >
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  <span className="text-sm font-bold text-green-900 whitespace-nowrap">
                                    ₪{formData.priceAmount.toFixed(2)}
                                  </span>
                                </motion.div>
                              )}
                            </div>

                            {/* Help Text & Validation */}
                            <div className="space-y-2">
                              {!validationErrors.priceAmount && (
                                <p id="price-help" className="text-sm text-gray-600 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                  <span>
                                    {formData.pricingModel === 'PER_GUEST'
                                      ? 'המחיר יוכפל במספר המשתתפים בהרשמה'
                                      : 'מחיר אחד קבוע לכל הרשמה'}
                                  </span>
                                </p>
                              )}

                              {validationErrors.priceAmount && (
                                <div id="price-error" role="alert" className="flex items-center gap-2 text-red-600 bg-red-50 border-2 border-red-300 rounded-lg p-3">
                                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                  <span className="text-sm font-medium">{validationErrors.priceAmount}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Inline Summary - Replaces Large Preview Card */}
                          {formData.priceAmount !== undefined && formData.priceAmount > 0 && !validationErrors.priceAmount && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                                {/* Payment Timing */}
                                <div className="flex items-center gap-2 flex-1">
                                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-gray-700">
                                    תשלום{' '}
                                    <strong className="text-blue-900">
                                      {formData.paymentTiming === 'UPFRONT'
                                        ? 'בעת ההרשמה'
                                        : 'לאחר האירוע'}
                                    </strong>
                                  </span>
                                </div>

                                {/* Example Calculation - Only for PER_GUEST */}
                                {formData.pricingModel === 'PER_GUEST' && formData.maxSpotsPerPerson > 1 && (
                                  <>
                                    <div className="hidden sm:block w-px h-6 bg-blue-300" aria-hidden="true" />
                                    <div className="flex items-center gap-2 text-blue-900">
                                      <Users className="w-4 h-4 flex-shrink-0" />
                                      <span className="font-medium">
                                        דוגמה: {formData.maxSpotsPerPerson} מקומות =
                                        <strong className="mr-1 text-lg">₪{(formData.priceAmount * formData.maxSpotsPerPerson).toFixed(2)}</strong>
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Free Event Badge */}
                    {formData.pricingModel === 'FREE' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 shadow-md"
                      >
                        <div className="flex items-center gap-3 justify-center">
                          <CheckCircle2 className="w-8 h-8 text-blue-600" />
                          <span className="text-lg font-bold text-blue-900">האירוע הוגדר כחינמי - אין צורך בתשלום</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No Payment Notice */}
              {!formData.paymentRequired && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle2 className="w-8 h-8 text-gray-600" />
                    <span className="text-lg font-bold text-gray-800">האירוע לא דורש תשלום - הרשמה חינמית</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )

      case 1: // Details (moved from case 0)
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

              {/* Game Type */}
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
                />
                {validationErrors.gameType && (
                  <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.gameType}
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  כותרת האירוע <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
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
                />
                <div className="flex items-center justify-between">
                  {validationErrors.title && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
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
                />
                <div className="flex items-center justify-between">
                  {validationErrors.description && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
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

      case 2: // Timing (moved from case 1)
        return (
          <motion.div
            key="step-2"
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

      case 3: // Capacity (moved from case 2)
        return (
          <motion.div
            key="step-3"
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
                      value={capacityInput}
                      onChange={(e) => handleCapacityChange(e.target.value)}
                      onBlur={handleCapacityBlur}
                      onFocus={handleNumberFocus}
                      className={`
                        w-full pl-4 pr-12 py-3 border-2 rounded-lg text-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400 transition-all
                        ${validationErrors.capacity ? 'border-red-500' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  {validationErrors.capacity && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
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
                      value={maxSpotsInput}
                      onChange={(e) => handleMaxSpotsChange(e.target.value)}
                      onBlur={handleMaxSpotsBlur}
                      onFocus={handleNumberFocus}
                      className={`
                        w-full pl-4 pr-12 py-3 border-2 rounded-lg text-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400 transition-all
                        ${validationErrors.maxSpotsPerPerson ? 'border-red-500' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    מספר המקומות המקסימלי שניתן להזמין בהרשמה אחת (בין 1 ל-10)
                  </p>
                  {validationErrors.maxSpotsPerPerson && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.maxSpotsPerPerson}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 4: // Advanced (moved from case 3)
        return (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Custom Fields */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">שדות נוספים להרשמה</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                הוסף שדות מותאמים אישית שהמשתתפים יצטרכו למלא בעת ההרשמה (שם, טלפון, גיל וכו')
              </p>
              <FieldBuilder fields={formData.fieldsSchema} onChange={(fields) => setFormData({ ...formData, fieldsSchema: fields })} />
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
                />
                <div className="flex items-center justify-between">
                  {validationErrors.conditions && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
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
                />
                <div className="flex items-center justify-between">
                  {validationErrors.completionMessage && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.completionMessage}
                    </span>
                  )}
                  <div className="flex-1" />
                  <CharCounter current={formData.completionMessage?.length ?? 0} max={CHAR_LIMITS.completionMessage} />
                </div>
                <p className="text-sm text-gray-500 mt-2">ההודעה תוצג למשתתפים לאחר שיסיימו את תהליך ההרשמה בהצלחה.</p>
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

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                עריכת אירוע: {eventTitle}
              </h1>
              <p className="text-gray-600 mt-1">עדכן את פרטי האירוע, תזמון, כמויות ושדות נוספים</p>
            </div>
          </div>
        </motion.div>

        {/* Step Wizard */}
        <div className="mb-8">
          <StepWizard steps={steps} currentStep={currentStep} onStepClick={goToStep} completedSteps={completedSteps} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-col-reverse sm:flex-row justify-between gap-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/admin/events/${eventId}`)}
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
                      <span>שומר שינויים...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>שמור שינויים</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </form>
      </div>
    </>
  )
}
