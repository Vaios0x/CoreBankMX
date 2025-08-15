import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const ProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  country: z.string().min(2),
  timezone: z.string()
})

const SecuritySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  sessionTimeout: z.number().min(5).max(480),
  maxLoginAttempts: z.number().min(3).max(10)
})

const TradingPreferencesSchema = z.object({
  defaultSlippage: z.number().min(0.1).max(10),
  autoApprove: z.boolean(),
  maxAutoApproveAmount: z.number().min(0),
  preferredGasSpeed: z.enum(['slow', 'standard', 'fast']),
  confirmTransactions: z.boolean(),
  showAdvancedOptions: z.boolean()
})

const NotificationSettingsSchema = z.object({
  priceAlerts: z.boolean(),
  liquidationWarnings: z.boolean(),
  transactionConfirmations: z.boolean(),
  marketUpdates: z.boolean(),
  securityAlerts: z.boolean(),
  promotionalEmails: z.boolean()
})

const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'es']),
  currency: z.enum(['USD', 'EUR', 'BTC']),
  notifications: z.boolean(),
  autoRefresh: z.boolean(),
  gasPreferences: z.object({
    fast: z.number().min(0),
    standard: z.number().min(0),
    slow: z.number().min(0)
  })
})

const SettingsSchema = z.object({
  address: z.string(),
  profile: ProfileSchema,
  security: SecuritySettingsSchema,
  trading: TradingPreferencesSchema,
  notifications: NotificationSettingsSchema,
  preferences: UserPreferencesSchema
})

const KYCVerificationSchema = z.object({
  address: z.string(),
  profile: ProfileSchema
})

const TwoFactorSchema = z.object({
  address: z.string()
})

export async function userRoutes(app: FastifyInstance) {
  // Obtener perfil del usuario
  app.get('/user/profile', async (req, res) => {
    const { address } = req.query as { address: string }
    
    if (!address) {
      return res.status(400).send({ 
        error: 'missing_address',
        message: 'Address is required'
      })
    }
    
    try {
      // Simular datos del usuario
      const profile = {
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '+52 55 1234 5678',
        country: 'MX',
        timezone: 'America/Mexico_City',
        kycStatus: 'verified' as const,
        kycLevel: 'enhanced' as const
      }

      const security = {
        twoFactorEnabled: false,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5
      }

      const trading = {
        defaultSlippage: 0.5,
        autoApprove: true,
        maxAutoApproveAmount: 1000,
        preferredGasSpeed: 'standard' as const,
        confirmTransactions: true,
        showAdvancedOptions: false
      }

      const notifications = {
        priceAlerts: true,
        liquidationWarnings: true,
        transactionConfirmations: true,
        marketUpdates: false,
        securityAlerts: true,
        promotionalEmails: false
      }

      return {
        success: true,
        data: {
          profile,
          security,
          trading,
          notifications
        }
      }
    } catch (error) {
      app.log.error('Error getting user profile:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get profile'
      })
    }
  })

  // Guardar configuración del usuario
  app.post('/user/settings', async (req, res) => {
    const parse = SettingsSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_payload', 
        issues: parse.error.issues 
      })
    }

    const { address, profile, security, trading, notifications, preferences } = parse.data
    
    try {
      // Aquí se guardarían los datos en la base de datos
      app.log.info('Saving user settings:', {
        address,
        profile: profile.name,
        email: profile.email
      })

      return {
        success: true,
        data: {
          message: 'Settings saved successfully',
          timestamp: Date.now()
        }
      }
    } catch (error) {
      app.log.error('Error saving user settings:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to save settings'
      })
    }
  })

  // Verificar KYC
  app.post('/user/kyc/verify', async (req, res) => {
    const parse = KYCVerificationSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_payload', 
        issues: parse.error.issues 
      })
    }

    const { address, profile } = parse.data
    
    try {
      // Simular proceso de verificación KYC
      app.log.info('Verifying KYC for user:', {
        address,
        name: profile.name,
        email: profile.email
      })

      // Simular verificación exitosa
      const status = 'verified'
      const level = 'enhanced'

      return {
        success: true,
        data: {
          status,
          level,
          verifiedAt: Date.now(),
          message: 'KYC verification completed successfully'
        }
      }
    } catch (error) {
      app.log.error('Error verifying KYC:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to verify KYC'
      })
    }
  })

  // Habilitar 2FA
  app.post('/user/2fa/enable', async (req, res) => {
    const parse = TwoFactorSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_payload', 
        issues: parse.error.issues 
      })
    }

    const { address } = parse.data
    
    try {
      // Simular generación de QR code para 2FA
      const secret = 'JBSWY3DPEHPK3PXP' // Secret key para TOTP
      const qrCodeUrl = `otpauth://totp/Banobs:${address}?secret=${secret}&issuer=Banobs`
      
      app.log.info('Enabling 2FA for user:', { address })

      return {
        success: true,
        data: {
          secret,
          qrCodeUrl,
          message: '2FA setup initiated. Scan the QR code with your authenticator app.'
        }
      }
    } catch (error) {
      app.log.error('Error enabling 2FA:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to enable 2FA'
      })
    }
  })

  // Verificar código 2FA
  app.post('/user/2fa/verify', async (req, res) => {
    const { address, code } = req.body as { address: string; code: string }
    
    if (!address || !code) {
      return res.status(400).send({ 
        error: 'missing_parameters',
        message: 'Address and code are required'
      })
    }
    
    try {
      // Aquí se verificaría el código TOTP
      // Por ahora simulamos verificación exitosa
      const isValid = code.length === 6 && /^\d+$/.test(code)
      
      if (!isValid) {
        return res.status(400).send({ 
          error: 'invalid_code',
          message: 'Invalid 2FA code'
        })
      }

      return {
        success: true,
        data: {
          verified: true,
          message: '2FA code verified successfully'
        }
      }
    } catch (error) {
      app.log.error('Error verifying 2FA code:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to verify 2FA code'
      })
    }
  })

  // Deshabilitar 2FA
  app.post('/user/2fa/disable', async (req, res) => {
    const { address } = req.body as { address: string }
    
    if (!address) {
      return res.status(400).send({ 
        error: 'missing_address',
        message: 'Address is required'
      })
    }
    
    try {
      app.log.info('Disabling 2FA for user:', { address })

      return {
        success: true,
        data: {
          message: '2FA disabled successfully'
        }
      }
    } catch (error) {
      app.log.error('Error disabling 2FA:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to disable 2FA'
      })
    }
  })

  // Obtener historial de actividad
  app.get('/user/activity', async (req, res) => {
    const { address } = req.query as { address: string }
    
    if (!address) {
      return res.status(400).send({ 
        error: 'missing_address',
        message: 'Address is required'
      })
    }
    
    try {
      // Simular historial de actividad
      const activity = [
        {
          id: '1',
          type: 'login',
          description: 'Successful login',
          timestamp: Date.now() - 3600000,
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          type: 'transaction',
          description: 'Borrow transaction completed',
          timestamp: Date.now() - 7200000,
          txHash: '0x123...',
          amount: '1000 USDT'
        },
        {
          id: '3',
          type: 'settings',
          description: 'Profile updated',
          timestamp: Date.now() - 86400000,
          changes: ['name', 'email']
        }
      ]

      return {
        success: true,
        data: {
          activity,
          total: activity.length
        }
      }
    } catch (error) {
      app.log.error('Error getting user activity:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get activity'
      })
    }
  })

  // Exportar datos del usuario
  app.get('/user/export', async (req, res) => {
    const { address } = req.query as { address: string }
    
    if (!address) {
      return res.status(400).send({ 
        error: 'missing_address',
        message: 'Address is required'
      })
    }
    
    try {
      // Simular exportación de datos
      const userData = {
        profile: {
          name: 'Juan Pérez',
          email: 'juan.perez@email.com',
          phone: '+52 55 1234 5678',
          country: 'MX',
          timezone: 'America/Mexico_City'
        },
        settings: {
          theme: 'dark',
          language: 'es',
          currency: 'USD'
        },
        activity: [
          {
            type: 'login',
            timestamp: Date.now() - 3600000
          }
        ],
        transactions: [
          {
            type: 'borrow',
            amount: '1000 USDT',
            timestamp: Date.now() - 7200000
          }
        ]
      }

      return {
        success: true,
        data: {
          userData,
          exportedAt: Date.now(),
          format: 'json'
        }
      }
    } catch (error) {
      app.log.error('Error exporting user data:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to export data'
      })
    }
  })

  // Eliminar cuenta del usuario
  app.delete('/user/account', async (req, res) => {
    const { address, confirmation } = req.body as { address: string; confirmation: string }
    
    if (!address || confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).send({ 
        error: 'invalid_confirmation',
        message: 'Confirmation phrase is required and must be "DELETE_MY_ACCOUNT"'
      })
    }
    
    try {
      app.log.warn('Deleting user account:', { address })

      return {
        success: true,
        data: {
          message: 'Account deletion initiated. This process cannot be undone.',
          deletedAt: Date.now()
        }
      }
    } catch (error) {
      app.log.error('Error deleting user account:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to delete account'
      })
    }
  })
}
