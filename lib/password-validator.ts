import zxcvbn from 'zxcvbn'

export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: number  // 0-4
}

const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'סיסמה', 'סיסמה123', '12345678'
]

export function validatePassword(password: string, email?: string): PasswordValidation {
  const errors: string[] = []

  // Length check
  if (password.length < 12) {
    errors.push('הסיסמה חייבת להיות לפחות 12 תווים')
  }

  if (password.length > 128) {
    errors.push('הסיסמה חייבת להיות עד 128 תווים')
  }

  // Complexity checks
  if (!/[a-z]/.test(password)) {
    errors.push('הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('הסיסמה חייבת להכיל לפחות ספרה אחת')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('הסיסמה חייבת להכיל לפחות תו מיוחד אחד')
  }

  // Check against common passwords
  const lowerPassword = password.toLowerCase()
  if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
    errors.push('הסיסמה נפוצה מדי. נא לבחור סיסמה חזקה יותר')
  }

  // Check if contains email
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
    errors.push('הסיסמה לא יכולה להכיל את כתובת האימייל')
  }

  // Use zxcvbn for strength analysis
  const result = zxcvbn(password)

  if (result.score < 2) {
    errors.push('הסיסמה חלשה מדי. נא לבחור סיסמה מורכבת יותר')
  }

  return {
    isValid: errors.length === 0 && result.score >= 2,
    errors,
    strength: result.score
  }
}
