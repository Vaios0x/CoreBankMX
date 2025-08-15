import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useI18n } from '../i18n/i18n'
import { useReferralStore } from '../state/useReferralStore'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { motion } from 'framer-motion'
import { formatUSD, formatNumber } from '../lib/format'
import { formatAddress } from '../lib/format'
import { useToastStore } from '../components/ui/Toast'

export function ReferralSystem() {
  const { address } = useAccount()
  const t = useI18n()
  const { push } = useToastStore()
  const { referrer, referred, commissionHistory, referralCodes, config, actions } = useReferralStore()
  
  const [referralCode, setReferralCode] = useState('')
  const [showCreateCode, setShowCreateCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Generar código de referral si no existe
  useEffect(() => {
    if (address && !referrer.code) {
      const code = actions.generateReferralCode(address)
      push({ type: 'success', message: 'Código de referral generado' })
    }
  }, [address, referrer.code, actions, push])

  // Obtener estadísticas del referidor
  const stats = address ? actions.getReferralStats(address) : {
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    level: 'bronze',
    nextLevel: null,
    progressToNextLevel: 0
  }

  // Manejar registro de referido
  const handleRegisterReferral = async () => {
    if (!address || !referralCode.trim()) {
      push({ type: 'error', message: 'Por favor ingresa un código de referral válido' })
      return
    }

    setIsLoading(true)
    try {
      actions.registerReferral(referralCode.trim(), address)
      setReferralCode('')
      push({ type: 'success', message: 'Referido registrado exitosamente' })
    } catch (error) {
      push({ type: 'error', message: error instanceof Error ? error.message : 'Error al registrar referido' })
    } finally {
      setIsLoading(false)
    }
  }

  // Copiar código al portapapeles
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    push({ type: 'success', message: 'Código copiado al portapapeles' })
  }

  // Obtener color del nivel
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'bg-amber-500'
      case 'silver': return 'bg-gray-400'
      case 'gold': return 'bg-yellow-400'
      case 'platinum': return 'bg-blue-400'
      case 'diamond': return 'bg-purple-400'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('referral.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('referral.subtitle')}
          </p>
        </div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-2"
        >
          <Badge className={`${getLevelColor(stats.level)} text-white`}>
            {stats.level.toUpperCase()}
          </Badge>
          {stats.nextLevel && (
            <span className="text-sm text-gray-500">
              → {stats.nextLevel.toUpperCase()}
            </span>
          )}
        </motion.div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.totalReferrals')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalReferrals)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.activeReferrals')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.activeReferrals)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.totalEarnings')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatUSD(stats.totalEarnings)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.progressToNextLevel')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.progressToNextLevel.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de progreso al siguiente nivel */}
      {stats.nextLevel && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progreso hacia {stats.nextLevel.toUpperCase()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.totalReferrals} de {config.levels[stats.nextLevel as keyof typeof config.levels]?.minReferrals} referidos necesarios
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.progressToNextLevel}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </Card>
      )}

      {/* Tu código de referral */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tu Código de Referral
        </h3>
        {referrer.code ? (
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                name="referralCode"
                label=""
                value={referrer.code}
                className="text-center font-mono text-lg"
              />
            </div>
            <button
              onClick={() => copyToClipboard(referrer.code)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copiar
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Generando tu código de referral...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="text-center">
            <p className="font-semibold">Comisión Base</p>
            <p>{config.baseCommissionRate * 100}%</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">Comisión Máxima</p>
            <p>{config.maxCommissionRate * 100}%</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">Bono por Referido</p>
            <p>{formatUSD(config.referralBonus)}</p>
          </div>
        </div>
      </Card>

      {/* Registrar referido */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Registrar Referido
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              name="referralCodeInput"
              label=""
              placeholder="Ingresa el código de referral"
              value={referralCode}
              onChange={(value) => setReferralCode(value)}
            />
          </div>
          <button
            onClick={handleRegisterReferral}
            disabled={isLoading || !referralCode.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </Card>

      {/* Historial de comisiones */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historial de Comisiones
        </h3>
        {commissionHistory.length > 0 ? (
          <div className="space-y-4">
            {commissionHistory.slice(0, 10).map((commission) => (
              <motion.div
                key={commission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {commission.type.charAt(0).toUpperCase() + commission.type.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatAddress(commission.referredAddress)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    +{formatUSD(commission.commission)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(commission.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              No hay comisiones registradas aún
            </p>
          </div>
        )}
      </Card>

      {/* Niveles y beneficios */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Niveles y Beneficios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(config.levels).map(([level, config]) => (
            <motion.div
              key={level}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border-2 ${
                stats.level === level 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {level}
                </h4>
                {stats.level === level && (
                  <Badge className="bg-blue-500 text-white">Actual</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {config.minReferrals} referidos mínimos
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {config.commissionRate * 100}% comisión
              </p>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
