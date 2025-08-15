import React, { useState, useEffect } from 'react'
import { useTranslation } from '../i18n/i18n'
import { useAccount } from 'wagmi'
import { getAnalytics, getErrorTracker, getPerformanceMonitor, getUserAnalytics, getABTesting } from '../lib/analytics'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { motion } from 'framer-motion'

interface AnalyticsStats {
  errorStats?: any
  performanceStats?: any
  userStats?: any
  abTestingStats?: any
}

export function Analytics() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const [stats, setStats] = useState<AnalyticsStats>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'performance' | 'users' | 'abtesting'>('overview')
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 segundos

  useEffect(() => {
    const updateStats = () => {
      const analytics = getAnalytics()
      if (analytics) {
        setStats(analytics.getAnalyticsStats())
      }
    }

    updateStats()
    const interval = setInterval(updateStats, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const tabs = [
    { id: 'overview', label: 'Vista General', icon: '📊' },
    { id: 'errors', label: 'Errores', icon: '🚨' },
    { id: 'performance', label: 'Rendimiento', icon: '⚡' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'abtesting', label: 'A/B Testing', icon: '🧪' },
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Errores (24h)</p>
              <p className="text-2xl font-bold">
                {stats.errorStats?.totalErrors || 0}
              </p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-bold">
                {stats.userStats?.recentSessions || 0}
              </p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Performance Promedio</p>
              <p className="text-2xl font-bold">
                {stats.performanceStats?.averageMetrics?.LCP ? 
                  `${Math.round(stats.performanceStats.averageMetrics.LCP)}ms` : 'N/A'}
              </p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Experimentos Activos</p>
              <p className="text-2xl font-bold">
                {stats.abTestingStats?.filter((exp: any) => exp.stats?.totalParticipants > 0).length || 0}
              </p>
            </div>
            <div className="text-3xl">🧪</div>
          </div>
        </Card>
      </div>

      {/* Gráficos de tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tendencias de Errores</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Gráfico de errores en tiempo real</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Web Vitals</h3>
          <div className="space-y-3">
            {stats.performanceStats?.averageMetrics && Object.entries(stats.performanceStats.averageMetrics).map(([metric, value]) => (
              <div key={metric} className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{Math.round(value as number)}ms</span>
                  <Badge variant={getPerformanceRating(value as number)}>
                    {getPerformanceRating(value as number)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderErrors = () => {
    const errorTracker = getErrorTracker()
    
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Configuración de Sentry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <Badge variant={stats.errorStats?.isInitialized ? 'success' : 'error'}>
                {stats.errorStats?.isInitialized ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Entorno</p>
              <p className="font-medium">{stats.errorStats?.environment || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sample Rate</p>
              <p className="font-medium">{stats.errorStats?.tracesSampleRate || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Errores Recientes</h3>
          <div className="space-y-3">
            {/* Aquí se mostrarían los errores recientes de Sentry */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">No hay errores recientes para mostrar</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const renderPerformance = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Métricas de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total de Métricas</p>
            <p className="text-2xl font-bold">{stats.performanceStats?.totalMetrics || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Métricas Recientes</p>
            <p className="text-2xl font-bold">{stats.performanceStats?.recentMetrics || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Métricas Blockchain</p>
            <p className="text-2xl font-bold">{stats.performanceStats?.blockchainMetrics || 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribución de Ratings</h3>
        <div className="space-y-3">
          {stats.performanceStats?.ratingDistribution && Object.entries(stats.performanceStats.ratingDistribution).map(([rating, count]) => (
            <div key={rating} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={rating as any}>{rating}</Badge>
                <span className="text-sm font-medium">{getRatingLabel(rating)}</span>
              </div>
              <span className="text-sm font-bold">{count as number}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Promedios por Métrica</h3>
        <div className="space-y-3">
          {stats.performanceStats?.averageMetrics && Object.entries(stats.performanceStats.averageMetrics).map(([metric, value]) => (
            <div key={metric} className="flex items-center justify-between">
              <span className="text-sm font-medium">{metric}</span>
              <span className="text-sm">{Math.round(value as number)}ms</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Estadísticas de Usuario</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total de Eventos</p>
            <p className="text-2xl font-bold">{stats.userStats?.totalEvents || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Eventos Recientes</p>
            <p className="text-2xl font-bold">{stats.userStats?.recentEvents || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total de Sesiones</p>
            <p className="text-2xl font-bold">{stats.userStats?.totalSessions || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sesiones Recientes</p>
            <p className="text-2xl font-bold">{stats.userStats?.recentSessions || 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Estadísticas de Transacciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.userStats?.transactionStats?.total || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Enviadas</p>
            <p className="text-2xl font-bold">{stats.userStats?.transactionStats?.sent || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Confirmadas</p>
            <p className="text-2xl font-bold">{stats.userStats?.transactionStats?.confirmed || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tasa de Éxito</p>
            <p className="text-2xl font-bold">{stats.userStats?.transactionStats?.successRate?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Features Más Usadas</h3>
        <div className="space-y-3">
          {stats.userStats?.mostUsedFeatures && Object.entries(stats.userStats.mostUsedFeatures).map(([feature, count]) => (
            <div key={feature} className="flex items-center justify-between">
              <span className="text-sm font-medium">{feature}</span>
              <span className="text-sm font-bold">{count as number}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderABTesting = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Experimentos Activos</h3>
        <div className="space-y-4">
          {stats.abTestingStats?.map((experiment: any) => (
            <div key={experiment.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{experiment.name}</h4>
                <Badge variant="info">Activo</Badge>
              </div>
              
              {experiment.stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Participantes</p>
                    <p className="text-lg font-bold">{experiment.stats.totalParticipants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Confianza</p>
                    <p className="text-lg font-bold">{(experiment.stats.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ganador</p>
                    <p className="text-lg font-bold">{experiment.stats.winner || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const getPerformanceRating = (value: number): 'success' | 'warning' | 'error' => {
    if (value <= 1000) return 'success'
    if (value <= 3000) return 'warning'
    return 'error'
  }

  const getRatingLabel = (rating: string): string => {
    const labels: Record<string, string> = {
      good: 'Bueno',
      'needs-improvement': 'Necesita Mejora',
      poor: 'Pobre',
    }
    return labels[rating] || rating
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitoreo completo de errores, rendimiento, usuarios y A/B testing</p>
      </div>

      {/* Tabs de navegación */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Configuración de actualización */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Intervalo de actualización</p>
              <p className="font-medium">{refreshInterval / 1000} segundos</p>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1 border rounded-lg"
            >
              <option value={10000}>10 segundos</option>
              <option value={30000}>30 segundos</option>
              <option value={60000}>1 minuto</option>
              <option value={300000}>5 minutos</option>
            </select>
          </div>
        </Card>
      </div>

      {/* Contenido de la pestaña activa */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'errors' && renderErrors()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'abtesting' && renderABTesting()}
      </motion.div>

      {/* Alertas y notificaciones */}
      <div className="mt-8">
        <Alert variant="info">
          <p className="text-sm">
            <strong>Nota:</strong> Los datos de analytics se actualizan automáticamente. 
            Para configuraciones avanzadas, contacta al equipo de desarrollo.
          </p>
        </Alert>
      </div>
    </div>
  )
}
