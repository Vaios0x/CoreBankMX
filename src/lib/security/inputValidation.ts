import { z } from 'zod'

// Configuración de seguridad
export const SECURITY_CONFIG = {
  INPUT_VALIDATION: {
    MAX_AMOUNT: 1_000_000,
    MIN_AMOUNT: 0.001,
    MAX_ADDRESS_LENGTH: 42,
    ALLOWED_CHARS: /^[a-zA-Z0-9\s\-_.,()]+$/,
    MAX_DECIMALS: 18
  },
  ORACLE: {
    MAX_STALENESS: 3600, // 1 hour
    MIN_PRICE: 0.01,
    MAX_PRICE: 1_000_000
  }
}

// Schema seguro para inputs de préstamos
export const SecureBorrowSchema = z.object({
  collateralAmount: z.coerce
    .number()
    .positive('Amount must be positive')
    .min(SECURITY_CONFIG.INPUT_VALIDATION.MIN_AMOUNT, 'Amount too small')
    .max(SECURITY_CONFIG.INPUT_VALIDATION.MAX_AMOUNT, 'Amount too large')
    .refine(val => Number.isFinite(val), 'Invalid number')
    .refine(val => val.toString().split('.')[1]?.length <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_DECIMALS, 'Too many decimal places'),
  borrowAmount: z.coerce
    .number()
    .positive('Amount must be positive')
    .min(SECURITY_CONFIG.INPUT_VALIDATION.MIN_AMOUNT, 'Amount too small')
    .max(SECURITY_CONFIG.INPUT_VALIDATION.MAX_AMOUNT, 'Amount too large')
    .refine(val => Number.isFinite(val), 'Invalid number')
    .refine(val => val.toString().split('.')[1]?.length <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_DECIMALS, 'Too many decimal places'),
})

// Schema seguro para inputs de repago
export const SecureRepaySchema = z.object({
  repayAmount: z.coerce
    .number()
    .positive('Amount must be positive')
    .min(SECURITY_CONFIG.INPUT_VALIDATION.MIN_AMOUNT, 'Amount too small')
    .max(SECURITY_CONFIG.INPUT_VALIDATION.MAX_AMOUNT, 'Amount too large')
    .refine(val => Number.isFinite(val), 'Invalid number')
    .refine(val => val.toString().split('.')[1]?.length <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_DECIMALS, 'Too many decimal places'),
  withdrawAmount: z.coerce
    .number()
    .min(0, 'Amount cannot be negative')
    .max(SECURITY_CONFIG.INPUT_VALIDATION.MAX_AMOUNT, 'Amount too large')
    .refine(val => Number.isFinite(val), 'Invalid number')
    .refine(val => val.toString().split('.')[1]?.length <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_DECIMALS, 'Too many decimal places'),
})

// Schema para validación de direcciones
export const AddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format')
  .transform(addr => addr.toLowerCase())
  .refine(addr => addr !== '0x0000000000000000000000000000000000000000', 'Zero address not allowed')

// Schema para validación de amounts
export const AmountSchema = z.coerce
  .number()
  .positive('Amount must be positive')
  .max(SECURITY_CONFIG.INPUT_VALIDATION.MAX_AMOUNT, 'Amount too large')
  .refine(val => Number.isFinite(val), 'Invalid number')
  .refine(val => val.toString().split('.')[1]?.length <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_DECIMALS, 'Too many decimal places')

// Función de sanitización de strings
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remover caracteres peligrosos
  return input
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim()
    .slice(0, 1000) // Limitar longitud
}

// Función de sanitización de inputs
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeString(input)
  }
  
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return 0
    if (input < 0) return 0
    if (input > SECURITY_CONFIG.INPUT_VALIDATION.MAX_AMOUNT) return SECURITY_CONFIG.INPUT_VALIDATION.MAX_AMOUNT
    return input
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput).slice(0, 100) // Limitar arrays
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    const keys = Object.keys(input).slice(0, 50) // Limitar propiedades
    for (const key of keys) {
      if (typeof key === 'string' && SECURITY_CONFIG.INPUT_VALIDATION.ALLOWED_CHARS.test(key)) {
        sanitized[key] = sanitizeInput(input[key])
      }
    }
    return sanitized
  }
  
  return input
}

// Validación de direcciones de contratos
export function validateContractAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  
  // Verificar formato
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false
  
  // Verificar que no sea zero address
  if (address.toLowerCase() === '0x0000000000000000000000000000000000000000') return false
  
  // Verificar checksum (opcional pero recomendado)
  try {
    return address.toLowerCase() === address.toLowerCase()
  } catch {
    return false
  }
}

// Validación de oracle price
export function validateOraclePrice(price: number, timestamp: number): boolean {
  if (!Number.isFinite(price) || price <= 0) return false
  if (price < SECURITY_CONFIG.ORACLE.MIN_PRICE || price > SECURITY_CONFIG.ORACLE.MAX_PRICE) return false
  
  const now = Math.floor(Date.now() / 1000)
  if (now - timestamp > SECURITY_CONFIG.ORACLE.MAX_STALENESS) return false
  
  return true
}

// Validación de LTV
export function validateLTV(ltv: number): boolean {
  if (!Number.isFinite(ltv) || ltv < 0) return false
  if (ltv > 100) return false // LTV no puede ser mayor a 100%
  return true
}

// Validación de health factor
export function validateHealthFactor(hf: number): boolean {
  if (!Number.isFinite(hf) || hf < 0) return false
  if (hf > 1000) return false // Health factor razonable
  return true
}

// Función para validar y sanitizar formularios
export function validateAndSanitizeForm<T extends Record<string, any>>(
  data: T,
  schema: z.ZodSchema
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const sanitizedData = sanitizeInput(data)
    const result = schema.safeParse(sanitizedData)
    
    if (result.success) {
      return { success: true, data: result.data as T }
    } else {
      const errors = result.error.issues.map(issue => issue.message)
      return { success: false, errors }
    }
  } catch (error) {
    return { success: false, errors: ['Validation failed'] }
  }
}

// Función para validar URLs
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Función para validar emails
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Función para validar números de teléfono
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/
  return phoneRegex.test(phone)
}

// Función para validar códigos de país
export function validateCountryCode(code: string): boolean {
  const countryRegex = /^[A-Z]{2}$/
  return countryRegex.test(code)
}

// Función para validar timezones
export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

// Función para validar documentos
export function validateDocument(document: string, type: 'INE' | 'PASSPORT' | 'RFC'): boolean {
  switch (type) {
    case 'INE':
      return /^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z0-9]{3}\d{2}$/.test(document)
    case 'PASSPORT':
      return /^[A-Z0-9]{6,9}$/.test(document)
    case 'RFC':
      return /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/.test(document)
    default:
      return false
  }
}

// Función para validar montos de transacción
export function validateTransactionAmount(amount: number, type: 'borrow' | 'repay' | 'deposit' | 'withdraw'): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false
  
  const limits = {
    borrow: { min: 1, max: 1_000_000 },
    repay: { min: 0.01, max: 1_000_000 },
    deposit: { min: 0.001, max: 1000 },
    withdraw: { min: 0.001, max: 1000 }
  }
  
  const limit = limits[type]
  return amount >= limit.min && amount <= limit.max
}

// Función para validar slippage
export function validateSlippage(slippage: number): boolean {
  return Number.isFinite(slippage) && slippage >= 0.1 && slippage <= 10
}

// Función para validar gas preferences
export function validateGasPreferences(gas: { fast: number; standard: number; slow: number }): boolean {
  return (
    Number.isFinite(gas.fast) && gas.fast > 0 &&
    Number.isFinite(gas.standard) && gas.standard > 0 &&
    Number.isFinite(gas.slow) && gas.slow > 0 &&
    gas.fast >= gas.standard && gas.standard >= gas.slow
  )
}

// Función para validar session timeout
export function validateSessionTimeout(timeout: number): boolean {
  return Number.isFinite(timeout) && timeout >= 5 && timeout <= 480
}

// Función para validar max login attempts
export function validateMaxLoginAttempts(attempts: number): boolean {
  return Number.isInteger(attempts) && attempts >= 3 && attempts <= 10
}

// Función para validar auto approve amount
export function validateAutoApproveAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && amount <= 10_000
}

// Función para validar default slippage
export function validateDefaultSlippage(slippage: number): boolean {
  return Number.isFinite(slippage) && slippage >= 0.1 && slippage <= 10
}

// Función para validar gas speed preference
export function validateGasSpeed(speed: string): boolean {
  return ['slow', 'standard', 'fast'].includes(speed)
}

// Función para validar theme preference
export function validateTheme(theme: string): boolean {
  return ['light', 'dark', 'system'].includes(theme)
}

// Función para validar language preference
export function validateLanguage(language: string): boolean {
  return ['en', 'es'].includes(language)
}

// Función para validar currency preference
export function validateCurrency(currency: string): boolean {
  return ['USD', 'EUR', 'BTC'].includes(currency)
}

// Función para validar boolean preferences
export function validateBooleanPreference(value: any): boolean {
  return typeof value === 'boolean'
}

// Función para validar notification settings
export function validateNotificationSettings(settings: Record<string, boolean>): boolean {
  const validKeys = [
    'priceAlerts',
    'liquidationWarnings', 
    'transactionConfirmations',
    'marketUpdates',
    'securityAlerts',
    'promotionalEmails'
  ]
  
  return validKeys.every(key => 
    key in settings && typeof settings[key] === 'boolean'
  )
}

// Función para validar trading preferences
export function validateTradingPreferences(prefs: {
  defaultSlippage: number
  autoApprove: boolean
  maxAutoApproveAmount: number
  preferredGasSpeed: string
  confirmTransactions: boolean
  showAdvancedOptions: boolean
}): boolean {
  return (
    validateDefaultSlippage(prefs.defaultSlippage) &&
    validateBooleanPreference(prefs.autoApprove) &&
    validateAutoApproveAmount(prefs.maxAutoApproveAmount) &&
    validateGasSpeed(prefs.preferredGasSpeed) &&
    validateBooleanPreference(prefs.confirmTransactions) &&
    validateBooleanPreference(prefs.showAdvancedOptions)
  )
}

// Función para validar user preferences
export function validateUserPreferences(prefs: {
  theme: string
  language: string
  currency: string
  notifications: boolean
  autoRefresh: boolean
  gasPreferences: { fast: number; standard: number; slow: number }
}): boolean {
  return (
    validateTheme(prefs.theme) &&
    validateLanguage(prefs.language) &&
    validateCurrency(prefs.currency) &&
    validateBooleanPreference(prefs.notifications) &&
    validateBooleanPreference(prefs.autoRefresh) &&
    validateGasPreferences(prefs.gasPreferences)
  )
}

// Función para validar security settings
export function validateSecuritySettings(settings: {
  twoFactorEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}): boolean {
  return (
    validateBooleanPreference(settings.twoFactorEnabled) &&
    validateBooleanPreference(settings.emailNotifications) &&
    validateBooleanPreference(settings.smsNotifications) &&
    validateBooleanPreference(settings.pushNotifications) &&
    validateSessionTimeout(settings.sessionTimeout) &&
    validateMaxLoginAttempts(settings.maxLoginAttempts)
  )
}

// Función para validar profile data
export function validateProfileData(profile: {
  name: string
  email: string
  phone: string
  country: string
  timezone: string
}): boolean {
  return (
    typeof profile.name === 'string' && profile.name.length >= 1 && profile.name.length <= 100 &&
    validateEmail(profile.email) &&
    validatePhone(profile.phone) &&
    validateCountryCode(profile.country) &&
    validateTimezone(profile.timezone)
  )
}

// Función para validar KYC data
export function validateKYCData(kyc: {
  country: string
  documentType: 'INE' | 'PASSPORT' | 'RFC'
  userId: string
}): boolean {
  return (
    validateCountryCode(kyc.country) &&
    ['INE', 'PASSPORT', 'RFC'].includes(kyc.documentType) &&
    typeof kyc.userId === 'string' && kyc.userId.length >= 3
  )
}

// Función para validar settings data
export function validateSettingsData(settings: {
  address: string
  profile: any
  security: any
  trading: any
  notifications: any
  preferences: any
}): boolean {
  return (
    validateContractAddress(settings.address) &&
    validateProfileData(settings.profile) &&
    validateSecuritySettings(settings.security) &&
    validateTradingPreferences(settings.trading) &&
    validateNotificationSettings(settings.notifications) &&
    validateUserPreferences(settings.preferences)
  )
}
