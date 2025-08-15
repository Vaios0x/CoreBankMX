import { z } from 'zod'
import { FastifyRequest, FastifyReply } from 'fastify'
import DOMPurify from 'isomorphic-dompurify'

// Configuración de seguridad
export const SECURITY_CONFIG = {
  MAX_INPUT_LENGTH: 1000,
  MAX_AMOUNT: 1000000000, // 1 billón
  MIN_AMOUNT: 0.000001,
  MAX_ADDRESS_LENGTH: 42,
  MAX_STRING_LENGTH: 500,
  ALLOWED_CHARS: /^[a-zA-Z0-9\s\-_.,@#$%&*()+=!?;:'"<>[\]{}|\\/]+$/,
  BLOCKED_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi,
    /console\./gi,
    /debugger/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /update\s+set/gi,
    /create\s+table/gi,
    /alter\s+table/gi,
    /exec\s*\(/gi,
    /execute\s*\(/gi,
    /system\s*\(/gi,
    /shell\s*\(/gi,
    /cmd\s*\(/gi,
    /powershell/gi,
    /bash\s*\(/gi,
    /sh\s*\(/gi,
  ]
}

// Schemas de validación seguros
export const SecureSchemas = {
  // Validación de direcciones Ethereum
  Address: z.string()
    .length(42, 'Dirección debe tener 42 caracteres')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Formato de dirección inválido')
    .transform(val => val.toLowerCase()),

  // Validación de montos
  Amount: z.number()
    .positive('Monto debe ser positivo')
    .min(SECURITY_CONFIG.MIN_AMOUNT, `Monto mínimo: ${SECURITY_CONFIG.MIN_AMOUNT}`)
    .max(SECURITY_CONFIG.MAX_AMOUNT, `Monto máximo: ${SECURITY_CONFIG.MAX_AMOUNT}`)
    .refine(val => !isNaN(val) && isFinite(val), 'Monto debe ser un número válido'),

  // Validación de strings seguros
  SafeString: z.string()
    .max(SECURITY_CONFIG.MAX_STRING_LENGTH, `Máximo ${SECURITY_CONFIG.MAX_STRING_LENGTH} caracteres`)
    .refine(val => SECURITY_CONFIG.ALLOWED_CHARS.test(val), 'Caracteres no permitidos')
    .transform(val => sanitizeString(val)),

  // Validación de emails
  Email: z.string()
    .email('Email inválido')
    .max(254, 'Email demasiado largo')
    .transform(val => val.toLowerCase().trim()),

  // Validación de LTV (Loan-to-Value)
  LTV: z.number()
    .min(0, 'LTV debe ser >= 0')
    .max(1, 'LTV debe ser <= 1')
    .refine(val => !isNaN(val) && isFinite(val), 'LTV debe ser un número válido'),

  // Validación de Health Factor
  HealthFactor: z.number()
    .positive('Health Factor debe ser positivo')
    .refine(val => !isNaN(val) && isFinite(val), 'Health Factor debe ser un número válido'),

  // Validación de API Key
  ApiKey: z.string()
    .min(32, 'API Key debe tener al menos 32 caracteres')
    .max(128, 'API Key demasiado larga')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'API Key contiene caracteres inválidos'),

  // Validación de transacciones
  Transaction: z.object({
    from: z.string().length(42),
    to: z.string().length(42),
    value: z.string().regex(/^0x[a-fA-F0-9]+$/),
    data: z.string().optional(),
    gasLimit: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(),
    gasPrice: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(),
  }),

  // Validación de préstamo
  BorrowRequest: z.object({
    collateralAmount: z.number().positive(),
    borrowAmount: z.number().positive(),
    collateralToken: z.string().length(42),
    borrowToken: z.string().length(42),
    userAddress: z.string().length(42),
  }),

  // Validación de pago
  RepayRequest: z.object({
    repayAmount: z.number().positive(),
    borrowToken: z.string().length(42),
    userAddress: z.string().length(42),
  }),

  // Validación de KYC
  KYCRequest: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    address: z.string().min(10).max(200),
    documentType: z.enum(['passport', 'national_id', 'drivers_license']),
    documentNumber: z.string().min(5).max(50),
  })
}

// Función de sanitización de strings
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return ''
  }

  // Verificar patrones bloqueados
  for (const pattern of SECURITY_CONFIG.BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      throw new Error('Contenido malicioso detectado')
    }
  }

  // Limitar longitud
  if (input.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
    input = input.substring(0, SECURITY_CONFIG.MAX_INPUT_LENGTH)
  }

  // Sanitizar con DOMPurify
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })

  // Remover caracteres peligrosos
  return sanitized
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim()
}

// Función de sanitización de objetos
export const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Función de validación de direcciones de contrato
export const validateContractAddress = (address: string): boolean => {
  try {
    const result = SecureSchemas.Address.parse(address)
    return result.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(result)
  } catch {
    return false
  }
}

// Función de validación de montos de transacción
export const validateTransactionAmount = (amount: number, type: 'deposit' | 'borrow' | 'repay'): boolean => {
  try {
    const result = SecureSchemas.Amount.parse(amount)
    
    // Validaciones específicas por tipo
    switch (type) {
      case 'deposit':
        return result >= SECURITY_CONFIG.MIN_AMOUNT && result <= SECURITY_CONFIG.MAX_AMOUNT
      case 'borrow':
        return result >= SECURITY_CONFIG.MIN_AMOUNT && result <= SECURITY_CONFIG.MAX_AMOUNT
      case 'repay':
        return result >= SECURITY_CONFIG.MIN_AMOUNT && result <= SECURITY_CONFIG.MAX_AMOUNT
      default:
        return false
    }
  } catch {
    return false
  }
}

// Función de validación de precios de oracle
export const validateOraclePrice = (price: number): boolean => {
  return price > 0 && price < 1000000 && !isNaN(price) && isFinite(price)
}

// Función de validación de LTV
export const validateLTV = (ltv: number): boolean => {
  try {
    SecureSchemas.LTV.parse(ltv)
    return true
  } catch {
    return false
  }
}

// Función de validación de Health Factor
export const validateHealthFactor = (health: number): boolean => {
  try {
    SecureSchemas.HealthFactor.parse(health)
    return true
  } catch {
    return false
  }
}

// Middleware de validación para Fastify
export const validationMiddleware = (schema: z.ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Sanitizar body, query y params
      if (request.body) {
        request.body = sanitizeObject(request.body)
      }
      if (request.query) {
        request.query = sanitizeObject(request.query)
      }
      if (request.params) {
        request.params = sanitizeObject(request.params)
      }

      // Validar con schema
      const validated = schema.parse({
        body: request.body,
        query: request.query,
        params: request.params
      })

      // Asignar datos validados
      request.body = validated.body
      request.query = validated.query
      request.params = validated.params

    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          error: 'Validation failed',
          message: 'Datos de entrada inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return
      }
      
      reply.status(400).send({
        error: 'Input sanitization failed',
        message: 'Error en sanitización de datos'
      })
      return
    }
  }
}

// Decorador para aplicar validación a rutas
export const withValidation = (schema: z.ZodSchema) => {
  return {
    preHandler: validationMiddleware(schema)
  }
}

// Función para validar y sanitizar datos de formulario
export const validateAndSanitizeForm = <T>(data: any, schema: z.ZodSchema<T>): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const sanitized = sanitizeObject(data)
    const validated = schema.parse(sanitized)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Error en sanitización de datos']
    }
  }
}

// Función para detectar intentos de inyección
export const detectInjectionAttempt = (input: string): boolean => {
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i,
    /console\./i,
    /debugger/i,
    /vbscript:/i,
    /expression\s*\(/i,
    /data:text\/html/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input/i,
    /<textarea/i,
    /<select/i,
    /<button/i,
    /<link/i,
    /<meta/i,
    /<style/i,
    /<base/i,
    /<bgsound/i,
    /<xmp/i,
    /<plaintext/i,
    /<listing/i,
    /<comment/i,
    /<nobr/i,
    /<noframes/i,
    /<noscript/i,
    /<noembed/i,
    /<noframes/i,
    /<nobr/i,
    /<plaintext/i,
    /<listing/i,
    /<xmp/i,
    /<comment/i,
    /<bgsound/i,
    /<base/i,
    /<style/i,
    /<meta/i,
    /<link/i,
    /<button/i,
    /<select/i,
    /<textarea/i,
    /<input/i,
    /<form/i,
    /<embed/i,
    /<object/i,
    /<iframe/i,
    /data:text\/html/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /debugger/i,
    /console\./i,
    /prompt\s*\(/i,
    /confirm\s*\(/i,
    /alert\s*\(/i,
    /window\./i,
    /document\./i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /update\s+set/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /drop\s+table/i,
    /union\s+select/i,
    /on\w+\s*=/i,
    /javascript:/i,
    /<script/i
  ]

  return injectionPatterns.some(pattern => pattern.test(input))
}
