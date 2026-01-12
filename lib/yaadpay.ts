import crypto from 'crypto'

// YaadPay Client Library - Event Ticketing Payments (Tier 2)
// Follows pattern from /lib/email.ts for lazy initialization

// Environment variables
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'

// Lazy initialization to avoid build-time errors
let yaadPayConfig: YaadPayConfig | null = null

interface YaadPayConfig {
  masof: string          // Terminal number
  apiSecret: string      // API secret for validation
  domainId: string       // Domain ID
  baseUrl: string        // Payment page URL
  testMode: boolean      // Enable test terminal
}

function getYaadPayConfig(): YaadPayConfig {
  const mockMode = process.env.YAADPAY_MOCK_MODE === 'true'

  // CRITICAL: Block mock mode in production
  if (process.env.NODE_ENV === 'production' && mockMode) {
    console.error('FATAL: YAADPAY_MOCK_MODE is TRUE in production!')
    console.error('This allows free registrations without payment.')
    console.error('Remove YAADPAY_MOCK_MODE from production environment IMMEDIATELY.')
    throw new Error(
      'SECURITY VIOLATION: Mock payment mode cannot be enabled in production. ' +
      'This must be fixed immediately to prevent financial loss.'
    )
  }

  // Warning for non-localhost mock mode
  if (mockMode) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
      console.error('WARNING: Mock payment mode is enabled on non-local URL!')
      console.error('Base URL:', baseUrl)
      console.error('This should only be used on localhost.')
    }
  }

  if (!yaadPayConfig) {
    const masof = process.env.YAADPAY_MASOF
    const apiSecret = process.env.YAADPAY_API_SECRET
    const domainId = process.env.YAADPAY_DOMAIN_ID

    if (!masof || !apiSecret || !domainId) {
      throw new Error(
        'YaadPay credentials not configured. Set YAADPAY_MASOF, YAADPAY_API_SECRET, YAADPAY_DOMAIN_ID'
      )
    }

    yaadPayConfig = {
      masof,
      apiSecret,
      domainId,
      baseUrl: process.env.YAADPAY_BASE_URL || 'https://yaadpay.co.il/p/',
      testMode: process.env.YAADPAY_TEST_MODE === 'true'  // Only use env variable, not NODE_ENV
    }
  }

  return yaadPayConfig
}

// Payment request data structure
export interface PaymentRequestData {
  amount: number                    // Amount in ILS (e.g., 150.50)
  orderId: string                   // Unique payment intent ID
  customerEmail: string
  customerName: string
  customerPhone: string
  description?: string
  metadata?: Record<string, unknown> // Additional data to track
}

// Payment request result
export interface PaymentRequest {
  redirectUrl: string               // URL to redirect user to YaadPay
  orderId: string                   // Same as input (for reference)
  formParams: Record<string, string> // POST form parameters
}

/**
 * Create a payment request and generate redirect URL
 * Returns form parameters for POST redirect to YaadPay
 */
export function createPaymentRequest(data: PaymentRequestData): PaymentRequest {
  const config = getYaadPayConfig()

  // Format amount to 2 decimal places (YaadPay expects "150.00")
  const formattedAmount = data.amount.toFixed(2)

  // Build form parameters (based on YaadPay API docs)
  const formParams: Record<string, string> = {
    Masof: config.masof,
    action: 'pay',
    Amount: formattedAmount,
    Order: data.orderId,                    // Our unique payment intent ID
    email: data.customerEmail,
    ClientName: data.customerName,
    phone: data.customerPhone,
    Info: data.description || '',
    PageLang: 'HEB',                        // Hebrew interface
    Currency: '1',                          // ILS
    UTF8: 'True',                           // UTF-8 encoding
    UTF8out: 'True',

    // Callback URLs
    success_url_address: `${BASE_URL}/api/payment/callback`,
    fail_url_address: `${BASE_URL}/api/payment/callback`,
    notify_url_address: `${BASE_URL}/api/payment/webhook`,  // Async notification

    // Custom parameters (returned in callback)
    Param1: JSON.stringify(data.metadata || {}),
  }

  // Add test mode parameter if enabled
  if (config.testMode) {
    formParams.Masof = '4500481839'  // Test terminal (if available)
    console.log('[YaadPay] Using TEST MODE terminal:', formParams.Masof)
  }

  console.log('[YaadPay] Creating payment request:', {
    orderId: data.orderId,
    amount: formattedAmount,
    masof: formParams.Masof,
    testMode: config.testMode
  })

  return {
    redirectUrl: config.baseUrl,
    orderId: data.orderId,
    formParams
  }
}

// YaadPay callback response structure
export interface YaadPayCallback {
  CCode: string                     // "0" = success, others = failure
  Order: string                     // Our payment intent ID
  Id: string                        // YaadPay transaction ID
  ConfirmationCode?: string         // Confirmation code (on success)
  Amount?: string                   // Amount charged
  ACode?: string                    // Additional code
  Param1?: string                   // Our custom metadata
  signature?: string                // Security signature (if configured)
}

// Callback validation result
export interface CallbackValidationResult {
  isValid: boolean
  isSuccess: boolean
  orderId: string
  transactionId: string
  confirmationCode?: string
  amount?: number
  metadata?: Record<string, unknown>
  errorMessage?: string
}

/**
 * Validate YaadPay callback parameters
 * Returns parsed and validated callback data
 */
export function validateCallback(params: YaadPayCallback): CallbackValidationResult {
  const config = getYaadPayConfig()

  // Parse CCode (0 = success)
  const cCode = parseInt(params.CCode || '-1')
  const isSuccess = cCode === 0

  console.log('[YaadPay] Validating callback:', {
    CCode: params.CCode,
    Order: params.Order,
    Id: params.Id,
    isSuccess
  })

  // Validate required fields
  if (!params.Order || !params.Id) {
    console.error('[YaadPay] Missing required callback parameters')
    return {
      isValid: false,
      isSuccess: false,
      orderId: params.Order || '',
      transactionId: params.Id || '',
      errorMessage: 'Missing required callback parameters'
    }
  }

  // Parse metadata
  let metadata: Record<string, unknown> | undefined
  if (params.Param1) {
    try {
      metadata = JSON.parse(params.Param1)
    } catch {
      // Invalid JSON in metadata - not a critical error
      console.warn('[YaadPay] Failed to parse metadata:', params.Param1)
    }
  }

  // MANDATORY signature validation
  const signature = params.signature
  if (!signature) {
    console.error('[YaadPay] Missing signature in callback - rejecting')
    return {
      isValid: false,
      isSuccess: false,
      orderId: params.Order || '',
      transactionId: params.Id || '',
      errorMessage: 'Missing callback signature - request rejected for security'
    }
  }

  const isValidSignature = validateSignature(params, config.apiSecret)
  if (!isValidSignature) {
    console.error('[YaadPay] Invalid signature - potential tampering detected')
    return {
      isValid: false,
      isSuccess: false,
      orderId: params.Order || '',
      transactionId: params.Id || '',
      errorMessage: 'Invalid signature - request rejected'
    }
  }

  return {
    isValid: true,
    isSuccess,
    orderId: params.Order,
    transactionId: params.Id,
    confirmationCode: params.ConfirmationCode,
    amount: params.Amount ? parseFloat(params.Amount) : undefined,
    metadata,
    errorMessage: isSuccess ? undefined : getYaadPayErrorMessage(cCode)
  }
}

/**
 * Validate signature from YaadPay callback
 * YaadPay signature validation based on their documentation
 */
function validateSignature(params: YaadPayCallback, secret: string): boolean {
  // YaadPay signature validation: HMAC-SHA256(Order + Amount + CCode + secret)
  const dataToSign = `${params.Order}${params.Amount}${params.CCode}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex')

  return params.signature === expectedSignature
}

/**
 * Get human-readable error message for YaadPay CCode
 */
function getYaadPayErrorMessage(cCode: number): string {
  // Based on YaadPay documentation
  const errorMessages: Record<number, string> = {
    0: 'העסקה בוצעה בהצלחה',
    1: 'כרטיס נחסם',
    2: 'כרטיס לא תקין',
    3: 'תקלה בתקשורת',
    4: 'העסקה נדחתה',
    5: 'סכום שגוי',
    6: 'כרטיס פג תוקף',
    7: 'שגיאה כללית',
    8: 'מספר תשלומים לא תקין',
    9: 'מספר תעודת זהות לא תקין',
    10: 'CVV שגוי',
    11: 'אין אישור',
    // Add more based on YaadPay docs
  }

  return errorMessages[cCode] || `שגיאה בתשלום (קוד ${cCode})`
}

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generate HTML form for POST redirect to YaadPay
 * (Next.js doesn't support HTTP POST redirects, so we use auto-submit form)
 */
export function generatePaymentRedirectHTML(paymentRequest: PaymentRequest): string {
  const { redirectUrl, formParams } = paymentRequest

  const formFields = Object.entries(formParams)
    .map(([key, value]) => `    <input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`)
    .join('\n')

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>מעביר לתשלום...</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      direction: rtl;
    }
    .loader {
      text-align: center;
      color: white;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      font-size: 24px;
      margin: 0 0 10px;
    }
    p {
      font-size: 14px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h2>מעביר לדף התשלום המאובטח...</h2>
    <p>אנא המתן, אל תסגור את הדפדפן</p>
  </div>
  <form id="paymentForm" action="${redirectUrl}" method="POST" style="display:none;">
${formFields}
  </form>
  <script>
    // Auto-submit form on page load
    document.getElementById('paymentForm').submit();
  </script>
</body>
</html>
  `.trim()
}
