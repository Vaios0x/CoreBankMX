import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useI18n } from '../i18n/i18n'
import { useLoyaltyStore } from '../state/useLoyaltyStore'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { motion } from 'framer-motion'
import { formatUSD, formatNumber } from '../lib/format'
import { useToastStore } from '../components/ui/Toast'

export function LoyaltyProgram() {
  const { address } = useAccount()
  const t = useI18n()
  const { push } = useToastStore()
  const { user, pointsHistory, rewards, claimedRewards, achievements, config, actions } = useLoyaltyStore()
  
  const [selectedReward, setSelectedReward] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  // Inicializar usuario si no existe
  useEffect(() => {
    if (address && !user.address) {
      // Simular ganancia de puntos por primera vez
      actions.earnPoints(100, 'Bienvenida', { address })
      push({ type: 'success', message: '¡Bienvenido al programa de lealtad!' })
    }
  }, [address, user.address, actions, push])

  // Obtener estadísticas del usuario
  const stats = address ? actions.getLoyaltyStats(address) : {
    points: 0,
    level: 'bronze',
    nextLevel: null,
    progressToNextLevel: 0,
    streak: 0,
    achievements: 0,
    totalRewards: 0
  }

  // Obtener recompensas disponibles
  const availableRewards = actions.getAvailableRewards(stats.level)

  // Manejar reclamación de recompensa
  const handleClaimReward = async (rewardId: string) => {
    if (!address) {
      push({ type: 'error', message: 'Conecta tu wallet para reclamar recompensas' })
      return
    }

    setIsClaiming(true)
    try {
      const success = actions.claimReward(rewardId, address)
      if (success) {
        setSelectedReward(null)
        push({ type: 'success', message: '¡Recompensa reclamada exitosamente!' })
      } else {
        push({ type: 'error', message: 'No tienes suficientes puntos para esta recompensa' })
      }
    } catch (error) {
      push({ type: 'error', message: 'Error al reclamar recompensa' })
    } finally {
      setIsClaiming(false)
    }
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

  // Obtener icono del logro
  const getAchievementIcon = (achievement: any) => {
    return achievement.isUnlocked ? achievement.icon : '🔒'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('loyalty.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('loyalty.subtitle')}
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
                Puntos Actuales
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.points)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Racha Actual
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.streak)} días
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Logros Desbloqueados
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.achievements)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Recompensas Reclamadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalRewards)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              {stats.progressToNextLevel.toFixed(1)}% completado
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

      {/* Recompensas disponibles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recompensas Disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRewards.map((reward) => (
            <motion.div
              key={reward.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {reward.name}
                </h4>
                <Badge className={`${
                  reward.level === 'bronze' ? 'bg-amber-500' :
                  reward.level === 'silver' ? 'bg-gray-400' :
                  reward.level === 'gold' ? 'bg-yellow-400' :
                  reward.level === 'platinum' ? 'bg-blue-400' :
                  'bg-purple-400'
                } text-white text-xs`}>
                  {reward.level}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {reward.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(reward.pointsCost)} pts
                </span>
                <button
                  onClick={() => handleClaimReward(reward.id)}
                  disabled={isClaiming || stats.points < reward.pointsCost}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isClaiming ? 'Reclamando...' : 'Reclamar'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {availableRewards.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              No hay recompensas disponibles para tu nivel actual
            </p>
          </div>
        )}
      </Card>

      {/* Logros */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Logros y Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border-2 ${
                achievement.isUnlocked 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{getAchievementIcon(achievement)}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {achievement.name}
                  </h4>
                  {achievement.isUnlocked && (
                    <Badge className="bg-green-500 text-white text-xs">
                      Desbloqueado
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {achievement.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  +{formatNumber(achievement.pointsReward)} pts
                </span>
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Historial de puntos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historial de Puntos
        </h3>
        {pointsHistory.length > 0 ? (
          <div className="space-y-3">
            {pointsHistory.slice(0, 10).map((point) => (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    point.type === 'earned' ? 'bg-green-100 dark:bg-green-900' :
                    point.type === 'spent' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      point.type === 'earned' ? 'text-green-600 dark:text-green-400' :
                      point.type === 'spent' ? 'text-red-600 dark:text-red-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {point.reason}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(point.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  point.type === 'earned' ? 'text-green-600 dark:text-green-400' :
                  point.type === 'spent' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {point.type === 'earned' ? '+' : point.type === 'spent' ? '-' : ''}{formatNumber(point.amount)} pts
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              No hay historial de puntos aún
            </p>
          </div>
        )}
      </Card>

      {/* Información de niveles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Información de Niveles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(config.levelRequirements).map(([level, requirements]) => (
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
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>• {formatNumber(requirements.minPoints)} puntos mínimos</p>
                <p>• {formatNumber(requirements.minTransactions)} transacciones</p>
                <p>• Multiplicador: x{config.levelMultipliers[level as keyof typeof config.levelMultipliers]}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
