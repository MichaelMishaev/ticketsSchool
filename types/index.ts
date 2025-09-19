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
}

export interface RegistrationFormData {
  [key: string]: any
  spotsCount: number
}