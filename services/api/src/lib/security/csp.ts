import { FastifyRequest, FastifyReply } from 'fastify'
import { FastifyPluginAsync } from 'fastify'

// Configuración de Content Security Policy
export const CSP_CONFIG = {
  // Política base para desarrollo
  DEVELOPMENT: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "http://localhost:*",
      "https://localhost:*",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "http:",
      "blob:"
    ],
    'connect-src': [
      "'self'",
      "http://localhost:*",
      "https://localhost:*",
      "wss://localhost:*",
      "ws://localhost:*",
      "https://api.coingecko.com",
      "https://api.pyth.network",
      "https://api.redstone.finance",
      "https://ethereum.publicnode.com",
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com",
      "https://cloudflare-eth.com"
    ],
    'frame-src': [
      "'self'",
      "https://www.google.com",
      "https://www.youtube.com"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
    'referrer-policy': ['strict-origin-when-cross-origin']
  },

  // Política estricta para producción
  PRODUCTION: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'nonce-{nonce}'",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "https://www.google-analytics.com",
      "https://stats.g.doubleclick.net"
    ],
    'connect-src': [
      "'self'",
      "https://api.coingecko.com",
      "https://api.pyth.network",
      "https://api.redstone.finance",
      "https://ethereum.publicnode.com",
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com",
      "https://cloudflare-eth.com",
      "https://www.google-analytics.com",
      "https://analytics.google.com"
    ],
    'frame-src': [
      "'self'",
      "https://www.google.com",
      "https://www.youtube.com"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
    'referrer-policy': ['strict-origin-when-cross-origin'],
    'require-trusted-types-for': ["'script'"],
    'trusted-types': ['default']
  },

  // Política para Web3/DeFi específica
  WEB3: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://ethereum.publicnode.com",
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com",
      "https://cloudflare-eth.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "https://www.google-analytics.com",
      "https://stats.g.doubleclick.net",
      "https://api.coingecko.com",
      "https://cryptologos.cc"
    ],
    'connect-src': [
      "'self'",
      "https://api.coingecko.com",
      "https://api.pyth.network",
      "https://api.redstone.finance",
      "https://ethereum.publicnode.com",
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com",
      "https://cloudflare-eth.com",
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "wss://ethereum.publicnode.com",
      "wss://eth.llamarpc.com",
      "wss://rpc.ankr.com",
      "wss://cloudflare-eth.com"
    ],
    'frame-src': [
      "'self'",
      "https://www.google.com",
      "https://www.youtube.com",
      "https://app.uniswap.org",
      "https://app.1inch.io",
      "https://app.curve.fi"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
    'referrer-policy': ['strict-origin-when-cross-origin']
  }
}

// Función para generar nonce único
export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Función para construir header CSP
export const buildCSPHeader = (policy: Record<string, string[]>, nonce?: string): string => {
  const directives: string[] = []

  for (const [directive, sources] of Object.entries(policy)) {
    if (directive === 'upgrade-insecure-requests' || directive === 'block-all-mixed-content') {
      directives.push(directive)
    } else {
      const sourceList = sources.map(source => {
        if (source === "'nonce-{nonce}'" && nonce) {
          return `'nonce-${nonce}'`
        }
        return source
      }).join(' ')
      directives.push(`${directive} ${sourceList}`)
    }
  }

  return directives.join('; ')
}

// Middleware de CSP para Fastify
export const cspMiddleware = (policy: Record<string, string[]> = CSP_CONFIG.PRODUCTION) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const nonce = generateNonce()
    const cspHeader = buildCSPHeader(policy, nonce)
    
    // Agregar nonce al request para uso en templates
    ;(request as any).cspNonce = nonce
    
    // Agregar headers de seguridad
    reply.header('Content-Security-Policy', cspHeader)
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    
    // Headers adicionales para Web3
    reply.header('Cross-Origin-Embedder-Policy', 'require-corp')
    reply.header('Cross-Origin-Opener-Policy', 'same-origin')
    reply.header('Cross-Origin-Resource-Policy', 'same-origin')
  }
}

// Plugin de CSP para Fastify
export const cspPlugin: FastifyPluginAsync = async (fastify) => {
  // Determinar política basada en entorno
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isWeb3 = process.env.ENABLE_WEB3_CSP === 'true'
  
  let policy: Record<string, string[]>
  
  if (isWeb3) {
    policy = CSP_CONFIG.WEB3
  } else if (isDevelopment) {
    policy = CSP_CONFIG.DEVELOPMENT
  } else {
    policy = CSP_CONFIG.PRODUCTION
  }

  // Aplicar middleware global
  fastify.addHook('preHandler', cspMiddleware(policy))

  // Ruta para obtener nonce (para uso en frontend)
  fastify.get('/api/security/csp-nonce', async (request, reply) => {
    const nonce = generateNonce()
    ;(request as any).cspNonce = nonce
    
    return { nonce }
  })

  // Ruta para reportar violaciones de CSP
  fastify.post('/api/security/csp-report', async (request, reply) => {
    const report = request.body as any
    
    // Log de violación de CSP
    fastify.log.warn({
      csp_violation: {
        document_uri: report['csp-report']?.['document-uri'],
        violated_directive: report['csp-report']?.['violated-directive'],
        blocked_uri: report['csp-report']?.['blocked-uri'],
        source_file: report['csp-report']?.['source-file'],
        line_number: report['csp-report']?.['line-number'],
        column_number: report['csp-report']?.['column-number'],
        status_code: report['csp-report']?.['status-code'],
        referrer: report['csp-report']?.['referrer']
      }
    }, 'CSP violation reported')

    reply.status(204).send()
  })
}

// Función para validar CSP report
export const validateCSPReport = (report: any): boolean => {
  if (!report || typeof report !== 'object') {
    return false
  }

  const cspReport = report['csp-report']
  if (!cspReport || typeof cspReport !== 'object') {
    return false
  }

  const requiredFields = ['document-uri', 'violated-directive']
  return requiredFields.every(field => cspReport.hasOwnProperty(field))
}

// Función para analizar violaciones de CSP
export const analyzeCSPViolation = (report: any): {
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendations: string[]
} => {
  const cspReport = report['csp-report']
  const violatedDirective = cspReport['violated-directive']
  const blockedUri = cspReport['blocked-uri']

  // Análisis de severidad basado en la directiva violada
  const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'script-src': 'critical',
    'object-src': 'critical',
    'base-uri': 'high',
    'frame-ancestors': 'high',
    'form-action': 'medium',
    'connect-src': 'medium',
    'img-src': 'low',
    'style-src': 'low',
    'font-src': 'low'
  }

  const severity = severityMap[violatedDirective] || 'medium'

  // Descripción y recomendaciones
  let description = `CSP violation: ${violatedDirective}`
  let recommendations: string[] = []

  switch (violatedDirective) {
    case 'script-src':
      description = 'Script execution blocked by CSP'
      recommendations = [
        'Review if the blocked script is legitimate',
        'Add the domain to script-src if needed',
        'Use nonces for inline scripts',
        'Consider using strict-dynamic'
      ]
      break
    case 'object-src':
      description = 'Object/embed content blocked by CSP'
      recommendations = [
        'Review if the blocked object is legitimate',
        'Consider using frame-src instead',
        'Avoid using object-src if possible'
      ]
      break
    case 'connect-src':
      description = 'Network connection blocked by CSP'
      recommendations = [
        'Review if the connection is legitimate',
        'Add the domain to connect-src if needed',
        'Check for API calls to unauthorized domains'
      ]
      break
    case 'frame-ancestors':
      description = 'Frame embedding blocked by CSP'
      recommendations = [
        'Review if the frame embedding is legitimate',
        'Add the domain to frame-ancestors if needed',
        'Consider security implications'
      ]
      break
    default:
      description = `CSP violation in ${violatedDirective}`
      recommendations = [
        'Review the blocked resource',
        'Add the domain to the appropriate directive if legitimate',
        'Check for security implications'
      ]
  }

  return { severity, description, recommendations }
}

// Función para generar CSP personalizado
export const generateCustomCSP = (options: {
  allowInlineScripts?: boolean
  allowEval?: boolean
  allowUnsafeInline?: boolean
  additionalDomains?: Record<string, string[]>
  strictMode?: boolean
}): Record<string, string[]> => {
  const {
    allowInlineScripts = false,
    allowEval = false,
    allowUnsafeInline = false,
    additionalDomains = {},
    strictMode = true
  } = options

  // Base policy
  const basePolicy = strictMode ? CSP_CONFIG.PRODUCTION : CSP_CONFIG.DEVELOPMENT
  const policy = { ...basePolicy }

  // Modificar script-src
  if (allowInlineScripts) {
    policy['script-src'] = policy['script-src'] || []
    policy['script-src'].push("'unsafe-inline'")
  }

  if (allowEval) {
    policy['script-src'] = policy['script-src'] || []
    policy['script-src'].push("'unsafe-eval'")
  }

  // Modificar style-src
  if (allowUnsafeInline) {
    policy['style-src'] = policy['style-src'] || []
    policy['style-src'].push("'unsafe-inline'")
  }

  // Agregar dominios adicionales
  for (const [directive, domains] of Object.entries(additionalDomains)) {
    if (policy[directive]) {
      policy[directive] = [...policy[directive], ...domains]
    } else {
      policy[directive] = domains
    }
  }

  return policy
}

// Función para validar política CSP
export const validateCSPPolicy = (policy: Record<string, string[]>): {
  valid: boolean
  errors: string[]
  warnings: string[]
} => {
  const errors: string[] = []
  const warnings: string[] = []

  // Verificar directivas requeridas
  const requiredDirectives = ['default-src']
  for (const directive of requiredDirectives) {
    if (!policy[directive]) {
      errors.push(`Missing required directive: ${directive}`)
    }
  }

  // Verificar directivas peligrosas
  const dangerousSources = ["'unsafe-inline'", "'unsafe-eval'", "data:", "blob:"]
  for (const [directive, sources] of Object.entries(policy)) {
    for (const source of sources) {
      if (dangerousSources.includes(source)) {
        warnings.push(`Potentially dangerous source in ${directive}: ${source}`)
      }
    }
  }

  // Verificar object-src
  if (policy['object-src'] && !policy['object-src'].includes("'none'")) {
    warnings.push("object-src should be set to 'none' for security")
  }

  // Verificar base-uri
  if (policy['base-uri'] && !policy['base-uri'].includes("'self'")) {
    warnings.push("base-uri should be restricted to 'self' for security")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Función para generar reporte de CSP
export const generateCSPReport = (policy: Record<string, string[]>): {
  summary: string
  directives: Array<{ name: string; sources: string[]; security: 'high' | 'medium' | 'low' }>
  recommendations: string[]
} => {
  const directives = Object.entries(policy).map(([name, sources]) => {
    let security: 'high' | 'medium' | 'low' = 'high'
    
    if (sources.includes("'unsafe-inline'") || sources.includes("'unsafe-eval'")) {
      security = 'low'
    } else if (sources.includes('data:') || sources.includes('blob:')) {
      security = 'medium'
    }

    return { name, sources, security }
  })

  const recommendations: string[] = []
  
  if (policy['object-src']?.includes("'none'")) {
    recommendations.push('✅ object-src is properly configured')
  } else {
    recommendations.push('⚠️ Consider setting object-src to "none"')
  }

  if (policy['script-src']?.includes("'unsafe-eval'")) {
    recommendations.push('⚠️ Consider removing unsafe-eval from script-src')
  }

  if (policy['script-src']?.includes("'unsafe-inline'")) {
    recommendations.push('⚠️ Consider using nonces instead of unsafe-inline')
  }

  const summary = `CSP Policy with ${directives.length} directives configured`

  return { summary, directives, recommendations }
}
