import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useI18n } from '../i18n/i18n'
import { useEducationalStore } from '../state/useEducationalStore'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { motion } from 'framer-motion'
import { formatNumber } from '../lib/format'
import { useToastStore } from '../components/ui/Toast'

export function EducationalContent() {
  const { address } = useAccount()
  const t = useI18n()
  const { push } = useToastStore()
  const { courses, lessons, userProgress, certificates, achievements, config, actions } = useEducationalStore()
  
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Inicializar usuario si no existe
  useEffect(() => {
    if (address && !userProgress.address) {
      push({ type: 'success', message: '¡Bienvenido a la Academia DeFi!' })
    }
  }, [address, userProgress.address, push])

  // Obtener estadísticas educativas
  const stats = address ? actions.getEducationalStats(address) : {
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    streak: 0,
    achievements: 0,
    certificates: 0
  }

  // Obtener cursos disponibles
  const availableCourses = address ? actions.getAvailableCourses(address) : []
  const userCertificates = address ? actions.getCertificates(address) : []
  const recommendations = address ? actions.getRecommendations(address) : []

  // Filtrar cursos por búsqueda y categoría
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Manejar inicio de curso
  const handleStartCourse = (courseId: string) => {
    if (!address) {
      push({ type: 'error', message: 'Conecta tu wallet para comenzar cursos' })
      return
    }

    actions.startCourse(courseId, address)
    setSelectedCourse(courseId)
    push({ type: 'success', message: '¡Curso iniciado exitosamente!' })
  }

  // Obtener color de dificultad
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-500'
      case 2: return 'bg-blue-500'
      case 3: return 'bg-yellow-500'
      case 4: return 'bg-orange-500'
      case 5: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Obtener color de categoría
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'advanced': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('education.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('education.subtitle')}
          </p>
        </div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-2"
        >
          <Badge className="bg-blue-500 text-white">
            {formatNumber(stats.completedCourses)}/{formatNumber(stats.totalCourses)} Cursos
          </Badge>
        </motion.div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cursos Completados
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.completedCourses)}
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
                Lecciones Completadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.completedLessons)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tiempo de Estudio
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalTimeSpent)} min
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Puntuación Promedio
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageScore.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Todas las categorías</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
            <option value="expert">Experto</option>
          </select>
        </div>
      </Card>

      {/* Cursos recomendados */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cursos Recomendados para Ti
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(course.category)}>
                    {course.category}
                  </Badge>
                  <Badge className={getDifficultyColor(course.difficulty)}>
                    Nivel {course.difficulty}
                  </Badge>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {formatNumber(course.duration)} min
                  </span>
                  <button
                    onClick={() => handleStartCourse(course.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Comenzar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Todos los cursos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Todos los Cursos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const progress = address ? actions.getCourseProgress(course.id, address) : { progress: 0 }
            const isStarted = progress.progress > 0
            const isCompleted = progress.progress === 100

            return (
              <motion.div
                key={course.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  isCompleted 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : isStarted 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(course.category)}>
                    {course.category}
                  </Badge>
                  <Badge className={getDifficultyColor(course.difficulty)}>
                    Nivel {course.difficulty}
                  </Badge>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {course.description}
                </p>
                
                {/* Barra de progreso */}
                {isStarted && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progreso</span>
                      <span>{progress.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <div>{formatNumber(course.duration)} min</div>
                    <div>{formatNumber(course.lessons.length)} lecciones</div>
                  </div>
                  <div className="flex space-x-2">
                    {isCompleted && (
                      <Badge className="bg-green-500 text-white">
                        Completado
                      </Badge>
                    )}
                    {!isCompleted && (
                      <button
                        onClick={() => handleStartCourse(course.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        {isStarted ? 'Continuar' : 'Comenzar'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        {filteredCourses.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              No se encontraron cursos que coincidan con tu búsqueda
            </p>
          </div>
        )}
      </Card>

      {/* Certificados */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Mis Certificados
        </h3>
        {userCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCertificates.map((certificate) => (
              <motion.div
                key={certificate.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500 text-white">
                    Certificado
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {certificate.score}%
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {certificate.metadata.courseTitle}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Completado el {new Date(certificate.issuedAt).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    ID: {certificate.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => window.open(`/certificate/${certificate.id}`, '_blank')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Ver
                  </button>
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
              No tienes certificados aún. ¡Completa cursos para obtenerlos!
            </p>
          </div>
        )}
      </Card>

      {/* Logros educativos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Logros Educativos
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
                <span className="text-2xl">{achievement.icon}</span>
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
    </div>
  )
}
