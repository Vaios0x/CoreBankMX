import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { useTranslation } from '../i18n/i18n'
import { motion } from 'framer-motion'
import { usePersistentStore, persistentActions } from '../state/usePersistentStore'
import { useUiStore } from '../state/useUiStore'

interface UserProfile {
  name: string
  email: string
  phone: string
  country: string
  timezone: string
  kycStatus: 'pending' | 'verified' | 'rejected'
  kycLevel: 'basic' | 'enhanced' | 'premium'
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

interface TradingPreferences {
  defaultSlippage: number
  autoApprove: boolean
  maxAutoApproveAmount: number
  preferredGasSpeed: 'slow' | 'standard' | 'fast'
  confirmTransactions: boolean
  showAdvancedOptions: boolean
}

interface NotificationSettings {
  priceAlerts: boolean
  liquidationWarnings: boolean
  transactionConfirmations: boolean
  marketUpdates: boolean
  securityAlerts: boolean
  promotionalEmails: boolean
}

export function Settings() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const userPreferences = usePersistentStore((state) => state.userPreferences)
  const { theme, language, setLanguage, toggleTheme } = useUiStore()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'trading' | 'notifications' | 'advanced'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // Estados para cada sección
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    country: 'MX',
    timezone: 'America/Mexico_City',
    kycStatus: 'pending',
    kycLevel: 'basic'
  })

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  })

  const [trading, setTrading] = useState<TradingPreferences>({
    defaultSlippage: 0.5,
    autoApprove: true,
    maxAutoApproveAmount: 1000,
    preferredGasSpeed: 'standard',
    confirmTransactions: true,
    showAdvancedOptions: false
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    priceAlerts: true,
    liquidationWarnings: true,
    transactionConfirmations: true,
    marketUpdates: false,
    securityAlerts: true,
    promotionalEmails: false
  })

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (!address) return
      
      try {
        // Simular llamada a API con delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Usar datos simulados para evitar errores de API
        // Los datos por defecto ya están configurados en el estado inicial
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [address])

  // Guardar configuración
  const saveSettings = async () => {
    if (!address) return
    
    setIsLoading(true)
    setSaveStatus('saving')
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          profile,
          security,
          trading,
          notifications,
          preferences: userPreferences
        })
      })
      
      if (response.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar preferencias del usuario
  const updateUserPreferences = (updates: Partial<typeof userPreferences>) => {
    persistentActions.updateUserPreferences(updates)
  }

  // Verificar KYC
  const verifyKYC = async () => {
    if (!address) return
    
    try {
      const response = await fetch('/api/user/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, profile })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfile(prev => ({ ...prev, kycStatus: data.status, kycLevel: data.level }))
      }
    } catch (error) {
      console.error('Error verifying KYC:', error)
    }
  }

  // Habilitar 2FA
  const enable2FA = async () => {
    try {
      const response = await fetch('/api/user/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSecurity(prev => ({ ...prev, twoFactorEnabled: true }))
        // Mostrar QR code para configurar 2FA
        window.open(data.qrCodeUrl, '_blank')
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
    }
  }

  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: '👤' },
    { id: 'preferences', label: t('settings.tabs.preferences'), icon: '⚙️' },
    { id: 'security', label: t('settings.tabs.security'), icon: '🔒' },
    { id: 'trading', label: t('settings.tabs.trading'), icon: '📈' },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: '🔔' },
    { id: 'advanced', label: t('settings.tabs.advanced'), icon: '🔧' }
  ]

  const getKYCStatusColor = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'verified': return 'green'
      case 'pending': return 'yellow'
      case 'rejected': return 'red'
      default: return 'gray'
    }
  }

  const getKYCStatusText = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'verified': return t('settings.kyc.verified')
      case 'pending': return t('settings.kyc.pending')
      case 'rejected': return t('settings.kyc.rejected')
      default: return t('settings.kyc.notStarted')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Status de guardado */}
        {saveStatus === 'saved' && (
          <Alert type="success" className="mb-6">
            {t('settings.saved')}
          </Alert>
        )}
        
        {saveStatus === 'error' && (
          <Alert type="error" className="mb-6">
            {t('settings.saveError')}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {/* Perfil del Usuario */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {t('settings.profile.title')}
                    </h2>
                    <Badge color={getKYCStatusColor(profile.kycStatus)}>
                      {getKYCStatusText(profile.kycStatus)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.name')}
                      </label>
                      <Input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={t('settings.profile.namePlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.email')}
                      </label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={t('settings.profile.emailPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.phone')}
                      </label>
                      <Input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder={t('settings.profile.phonePlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.country')}
                      </label>
                      <select
                        value={profile.country}
                        onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="MX">México</option>
                        <option value="US">Estados Unidos</option>
                        <option value="CA">Canadá</option>
                        <option value="ES">España</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.timezone')}
                      </label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="America/Mexico_City">México (GMT-6)</option>
                        <option value="America/New_York">Nueva York (GMT-5)</option>
                        <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                        <option value="Europe/Madrid">Madrid (GMT+1)</option>
                      </select>
                    </div>
                  </div>

                  {profile.kycStatus !== 'verified' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                            {t('settings.kyc.title')}
                          </h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            {t('settings.kyc.description')}
                          </p>
                        </div>
                        <button
                          onClick={verifyKYC}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
                        >
                          {t('settings.kyc.verify')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preferencias Generales */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">
                    {t('settings.preferences.title')}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.preferences.theme')}
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => {
                          if (e.target.value === 'light') {
                            toggleTheme()
                          } else if (e.target.value === 'dark') {
                            toggleTheme()
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="light">{t('settings.preferences.themeLight')}</option>
                        <option value="dark">{t('settings.preferences.themeDark')}</option>
                        <option value="system">{t('settings.preferences.themeSystem')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.preferences.language')}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.preferences.currency')}
                      </label>
                      <select
                        value={userPreferences.currency}
                        onChange={(e) => updateUserPreferences({ currency: e.target.value as 'USD' | 'EUR' | 'BTC' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="BTC">BTC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.preferences.autoRefresh')}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userPreferences.autoRefresh}
                          onChange={(e) => updateUserPreferences({ autoRefresh: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm">{t('settings.preferences.autoRefreshDesc')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">
                      {t('settings.preferences.gasPreferences')}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.preferences.gasFast')}
                        </label>
                        <Input
                          type="number"
                          value={userPreferences.gasPreferences.fast}
                          onChange={(e) => updateUserPreferences({
                            gasPreferences: { ...userPreferences.gasPreferences, fast: Number(e.target.value) }
                          })}
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.preferences.gasStandard')}
                        </label>
                        <Input
                          type="number"
                          value={userPreferences.gasPreferences.standard}
                          onChange={(e) => updateUserPreferences({
                            gasPreferences: { ...userPreferences.gasPreferences, standard: Number(e.target.value) }
                          })}
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.preferences.gasSlow')}
                        </label>
                        <Input
                          type="number"
                          value={userPreferences.gasPreferences.slow}
                          onChange={(e) => updateUserPreferences({
                            gasPreferences: { ...userPreferences.gasPreferences, slow: Number(e.target.value) }
                          })}
                          placeholder="20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seguridad */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">
                    {t('settings.security.title')}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div>
                        <h3 className="font-medium">{t('settings.security.2fa')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.security.2faDesc')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge color={security.twoFactorEnabled ? 'green' : 'gray'}>
                          {security.twoFactorEnabled ? t('settings.security.enabled') : t('settings.security.disabled')}
                        </Badge>
                        {!security.twoFactorEnabled && (
                          <button
                            onClick={enable2FA}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >
                            {t('settings.security.enable')}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div>
                        <h3 className="font-medium">{t('settings.security.sessionTimeout')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.security.sessionTimeoutDesc')}
                        </p>
                      </div>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value={15}>15 {t('settings.security.minutes')}</option>
                        <option value={30}>30 {t('settings.security.minutes')}</option>
                        <option value={60}>1 {t('settings.security.hour')}</option>
                        <option value={120}>2 {t('settings.security.hours')}</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div>
                        <h3 className="font-medium">{t('settings.security.maxLoginAttempts')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.security.maxLoginAttemptsDesc')}
                        </p>
                      </div>
                      <select
                        value={security.maxLoginAttempts}
                        onChange={(e) => setSecurity(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferencias de Trading */}
              {activeTab === 'trading' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">
                    {t('settings.trading.title')}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.trading.defaultSlippage')}
                      </label>
                      <Input
                        type="number"
                        value={trading.defaultSlippage}
                        onChange={(e) => setTrading(prev => ({ ...prev, defaultSlippage: Number(e.target.value) }))}
                        placeholder="0.5"
                        step="0.1"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {t('settings.trading.defaultSlippageDesc')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.trading.preferredGasSpeed')}
                      </label>
                      <select
                        value={trading.preferredGasSpeed}
                        onChange={(e) => setTrading(prev => ({ ...prev, preferredGasSpeed: e.target.value as 'slow' | 'standard' | 'fast' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="slow">{t('settings.trading.gasSlow')}</option>
                        <option value="standard">{t('settings.trading.gasStandard')}</option>
                        <option value="fast">{t('settings.trading.gasFast')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.trading.maxAutoApproveAmount')}
                      </label>
                      <Input
                        type="number"
                        value={trading.maxAutoApproveAmount}
                        onChange={(e) => setTrading(prev => ({ ...prev, maxAutoApproveAmount: Number(e.target.value) }))}
                        placeholder="1000"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {t('settings.trading.maxAutoApproveAmountDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.trading.autoApprove')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.trading.autoApproveDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={trading.autoApprove}
                        onChange={(e) => setTrading(prev => ({ ...prev, autoApprove: e.target.checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.trading.confirmTransactions')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.trading.confirmTransactionsDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={trading.confirmTransactions}
                        onChange={(e) => setTrading(prev => ({ ...prev, confirmTransactions: e.target.checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.trading.showAdvancedOptions')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.trading.showAdvancedOptionsDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={trading.showAdvancedOptions}
                        onChange={(e) => setTrading(prev => ({ ...prev, showAdvancedOptions: e.target.checked }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notificaciones */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">
                    {t('settings.notifications.title')}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.notifications.priceAlerts')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.notifications.priceAlertsDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.priceAlerts}
                        onChange={(e) => setNotifications(prev => ({ ...prev, priceAlerts: e.target.checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.notifications.liquidationWarnings')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.notifications.liquidationWarningsDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.liquidationWarnings}
                        onChange={(e) => setNotifications(prev => ({ ...prev, liquidationWarnings: e.target.checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.notifications.transactionConfirmations')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.notifications.transactionConfirmationsDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.transactionConfirmations}
                        onChange={(e) => setNotifications(prev => ({ ...prev, transactionConfirmations: e.target.checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.notifications.marketUpdates')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.notifications.marketUpdatesDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.marketUpdates}
                        onChange={(e) => setNotifications(prev => ({ ...prev, marketUpdates: e.target.checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.notifications.securityAlerts')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.notifications.securityAlertsDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.securityAlerts}
                        onChange={(e) => setNotifications(prev => ({ ...prev, securityAlerts: e.target.checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{t('settings.notifications.promotionalEmails')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('settings.notifications.promotionalEmailsDesc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.promotionalEmails}
                        onChange={(e) => setNotifications(prev => ({ ...prev, promotionalEmails: e.target.checked }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración Avanzada */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">
                    {t('settings.advanced.title')}
                  </h2>

                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        {t('settings.advanced.dangerZone')}
                      </h3>
                      <div className="space-y-3">
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                          {t('settings.advanced.clearCache')}
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg ml-2">
                          {t('settings.advanced.resetSettings')}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        {t('settings.advanced.exportData')}
                      </h3>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        {t('settings.advanced.exportSettings')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => {
                    // Resetear cambios
                    window.location.reload()
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
