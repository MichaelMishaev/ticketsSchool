export type FieldType = 'text' | 'number' | 'dropdown' | 'checkbox'

export interface FieldSchema {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface EventFormData {
  title: string
  description?: string
  gameType?: string
  location?: string
  startAt: string
  endAt?: string
  capacity: number
  maxSpotsPerPerson: number
  fieldsSchema: FieldSchema[]
  conditions?: string
  requireAcceptance: boolean
  completionMessage?: string
  // Payment settings (Tier 2: Event Ticketing - YaadPay)
  paymentRequired: boolean
  paymentTiming: 'OPTIONAL' | 'UPFRONT' | 'POST_REGISTRATION'
  pricingModel: 'FIXED_PRICE' | 'PER_GUEST' | 'FREE'
  priceAmount?: number
  currency: string
}

export interface RegistrationFormData {
  [key: string]: any
  spotsCount: number
}