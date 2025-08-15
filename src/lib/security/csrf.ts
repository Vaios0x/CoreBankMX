// CSRF Protection System
export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token'
  private static readonly TOKEN_LENGTH = 32
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 horas
  
  // Generar token CSRF seguro
  private static generateToken(): string {
    if (typeof window !== 'undefined' && window.crypto) {
      // Usar Web Crypto API si está disponible
      const array = new Uint8Array(this.TOKEN_LENGTH)
      window.crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    } else {
      // Fallback para entornos sin Web Crypto API
      let token = ''
      for (let i = 0; i < this.TOKEN_LENGTH; i++) {
        token += Math.random().toString(16).substr(2, 1)
      }
      return token
    }
  }
  
  // Obtener token CSRF (generar si no existe)
  static getToken(): string {
    if (typeof window === 'undefined') return ''
    
    let token = sessionStorage.getItem(this.TOKEN_KEY)
    let tokenData: { token: string; expiry: number } | null = null
    
    if (token) {
      try {
        tokenData = JSON.parse(token)
      } catch {
        // Token inválido, generar uno nuevo
        tokenData = null
      }
    }
    
    // Verificar si el token existe y no ha expirado
    if (tokenData && tokenData.expiry > Date.now()) {
      return tokenData.token
    }
    
    // Generar nuevo token
    const newToken = this.generateToken()
    const newTokenData = {
      token: newToken,
      expiry: Date.now() + this.TOKEN_EXPIRY
    }
    
    try {
      sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(newTokenData))
    } catch (error) {
      console.warn('Failed to store CSRF token:', error)
    }
    
    return newToken
  }
  
  // Validar token CSRF
  static validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    const storedToken = this.getToken()
    return token === storedToken
  }
  
  // Refrescar token CSRF
  static refreshToken(): string {
    if (typeof window === 'undefined') return ''
    
    // Remover token existente
    sessionStorage.removeItem(this.TOKEN_KEY)
    
    // Generar nuevo token
    return this.getToken()
  }
  
  // Limpiar token CSRF
  static clearToken(): void {
    if (typeof window === 'undefined') return
    
    sessionStorage.removeItem(this.TOKEN_KEY)
  }
  
  // Verificar si el token está próximo a expirar
  static isTokenExpiringSoon(thresholdMinutes: number = 30): boolean {
    if (typeof window === 'undefined') return false
    
    const token = sessionStorage.getItem(this.TOKEN_KEY)
    if (!token) return true
    
    try {
      const tokenData = JSON.parse(token)
      const timeUntilExpiry = tokenData.expiry - Date.now()
      const thresholdMs = thresholdMinutes * 60 * 1000
      
      return timeUntilExpiry <= thresholdMs
    } catch {
      return true
    }
  }
  
  // Obtener tiempo restante del token
  static getTokenTimeRemaining(): number {
    if (typeof window === 'undefined') return 0
    
    const token = sessionStorage.getItem(this.TOKEN_KEY)
    if (!token) return 0
    
    try {
      const tokenData = JSON.parse(token)
      return Math.max(0, tokenData.expiry - Date.now())
    } catch {
      return 0
    }
  }
}

// Hook para usar CSRF protection en componentes React
export function useCSRF() {
  const getToken = (): string => {
    return CSRFProtection.getToken()
  }
  
  const validateToken = (token: string): boolean => {
    return CSRFProtection.validateToken(token)
  }
  
  const refreshToken = (): string => {
    return CSRFProtection.refreshToken()
  }
  
  const clearToken = (): void => {
    CSRFProtection.clearToken()
  }
  
  const isTokenExpiringSoon = (thresholdMinutes?: number): boolean => {
    return CSRFProtection.isTokenExpiringSoon(thresholdMinutes)
  }
  
  const getTokenTimeRemaining = (): number => {
    return CSRFProtection.getTokenTimeRemaining()
  }
  
  return {
    getToken,
    validateToken,
    refreshToken,
    clearToken,
    isTokenExpiringSoon,
    getTokenTimeRemaining
  }
}

// Función para agregar token CSRF a headers de fetch
export function addCSRFTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = CSRFProtection.getToken()
  
  if (typeof headers === 'object' && !Array.isArray(headers)) {
    return {
      ...headers,
      'X-CSRF-Token': token
    }
  }
  
  if (Array.isArray(headers)) {
    return [...headers, ['X-CSRF-Token', token]]
  }
  
  return {
    'X-CSRF-Token': token
  }
}

// Función para crear fetch con CSRF protection
export function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfHeaders = addCSRFTokenToHeaders(options.headers)
  
  return fetch(url, {
    ...options,
    headers: csrfHeaders
  })
}

// Función para verificar respuesta CSRF
export function validateCSRFResponse(response: Response): boolean {
  const csrfHeader = response.headers.get('X-CSRF-Valid')
  return csrfHeader === 'true'
}

// Función para manejar errores CSRF
export function handleCSRFError(error: any): void {
  if (error.message?.includes('CSRF') || error.status === 403) {
    // Token CSRF inválido, refrescar
    CSRFProtection.refreshToken()
    console.warn('CSRF token invalid, refreshed')
  }
}

// Función para decorar funciones con CSRF protection
export function withCSRF<T extends any[], R>(
  fn: (...args: T) => R | Promise<R>
): (...args: T) => R | Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      const result = await fn(...args)
      return result
    } catch (error) {
      handleCSRFError(error)
      throw error
    }
  }
}

// Función para crear formulario seguro con CSRF
export function createSecureForm(
  action: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
): HTMLFormElement {
  const form = document.createElement('form')
  form.action = action
  form.method = method
  
  // Agregar token CSRF como campo oculto
  const csrfInput = document.createElement('input')
  csrfInput.type = 'hidden'
  csrfInput.name = 'csrf_token'
  csrfInput.value = CSRFProtection.getToken()
  
  form.appendChild(csrfInput)
  return form
}

// Función para validar formulario con CSRF
export function validateFormCSRF(form: HTMLFormElement): boolean {
  const csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement
  if (!csrfInput) return false
  
  return CSRFProtection.validateToken(csrfInput.value)
}

// Función para agregar CSRF token a formulario existente
export function addCSRFTokenToForm(form: HTMLFormElement): void {
  // Verificar si ya existe un token CSRF
  const existingToken = form.querySelector('input[name="csrf_token"]')
  if (existingToken) return
  
  const csrfInput = document.createElement('input')
  csrfInput.type = 'hidden'
  csrfInput.name = 'csrf_token'
  csrfInput.value = CSRFProtection.getToken()
  
  form.appendChild(csrfInput)
}

// Función para refrescar CSRF token en formulario
export function refreshFormCSRFToken(form: HTMLFormElement): void {
  const csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement
  if (csrfInput) {
    csrfInput.value = CSRFProtection.getToken()
  }
}

// Función para validar y procesar envío de formulario
export function submitFormWithCSRF(
  form: HTMLFormElement,
  onSubmit?: (formData: FormData) => void | Promise<void>
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Validar token CSRF
      if (!validateFormCSRF(form)) {
        throw new Error('Invalid CSRF token')
      }
      
      // Crear FormData
      const formData = new FormData(form)
      
      // Llamar callback si existe
      if (onSubmit) {
        await onSubmit(formData)
      }
      
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

// Función para crear URL con parámetro CSRF
export function createURLWithCSRF(url: string): string {
  const token = CSRFProtection.getToken()
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}csrf_token=${encodeURIComponent(token)}`
}

// Función para validar URL con parámetro CSRF
export function validateURLWithCSRF(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const csrfToken = urlObj.searchParams.get('csrf_token')
    return csrfToken ? CSRFProtection.validateToken(csrfToken) : false
  } catch {
    return false
  }
}

// Función para limpiar tokens CSRF expirados
export function cleanupExpiredCSRFTokens(): void {
  if (typeof window === 'undefined') return
  
  const token = sessionStorage.getItem(CSRFProtection['TOKEN_KEY'])
  if (!token) return
  
  try {
    const tokenData = JSON.parse(token)
    if (tokenData.expiry <= Date.now()) {
      sessionStorage.removeItem(CSRFProtection['TOKEN_KEY'])
    }
  } catch {
    // Token inválido, remover
    sessionStorage.removeItem(CSRFProtection['TOKEN_KEY'])
  }
}

// Limpiar tokens expirados cada hora
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredCSRFTokens, 60 * 60 * 1000)
}

// Función para inicializar CSRF protection
export function initializeCSRF(): void {
  if (typeof window === 'undefined') return
  
  // Generar token inicial
  CSRFProtection.getToken()
  
  // Agregar listener para refrescar token antes de expirar
  setInterval(() => {
    if (CSRFProtection.isTokenExpiringSoon(30)) {
      CSRFProtection.refreshToken()
    }
  }, 5 * 60 * 1000) // Verificar cada 5 minutos
}

// Función para obtener estado de CSRF protection
export function getCSRFStatus(): {
  hasToken: boolean
  isExpiringSoon: boolean
  timeRemaining: number
  isValid: boolean
} {
  const token = CSRFProtection.getToken()
  const hasToken = !!token
  const isExpiringSoon = CSRFProtection.isTokenExpiringSoon()
  const timeRemaining = CSRFProtection.getTokenTimeRemaining()
  const isValid = CSRFProtection.validateToken(token)
  
  return {
    hasToken,
    isExpiringSoon,
    timeRemaining,
    isValid
  }
}

// Función para registrar eventos CSRF
export function logCSRFEvent(event: string, details?: any): void {
  console.log(`CSRF Event: ${event}`, details)
  
  // Aquí podrías enviar analytics o logging
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'csrf_event', {
      event_type: event,
      details
    })
  }
}

// Función para manejar errores CSRF en fetch
export function createCSRFFetchWrapper(
  baseFetch: typeof fetch = fetch
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      // Agregar token CSRF a headers
      const csrfHeaders = addCSRFTokenToHeaders(init?.headers)
      
      const response = await baseFetch(input, {
        ...init,
        headers: csrfHeaders
      })
      
      // Verificar si la respuesta indica error CSRF
      if (response.status === 403) {
        const responseText = await response.text()
        if (responseText.includes('CSRF') || responseText.includes('csrf')) {
          // Refrescar token y reintentar
          CSRFProtection.refreshToken()
          logCSRFEvent('token_refreshed_after_403')
          
          const retryHeaders = addCSRFTokenToHeaders(init?.headers)
          return baseFetch(input, {
            ...init,
            headers: retryHeaders
          })
        }
      }
      
      return response
    } catch (error) {
      handleCSRFError(error)
      throw error
    }
  }
}

// Exportar tipos
export interface CSRFStatus {
  hasToken: boolean
  isExpiringSoon: boolean
  timeRemaining: number
  isValid: boolean
}

export interface CSRFTokenData {
  token: string
  expiry: number
}

// Inicializar CSRF protection automáticamente
if (typeof window !== 'undefined') {
  initializeCSRF()
}
