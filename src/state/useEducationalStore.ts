import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

// Tipos para el sistema educativo
export interface EducationalData {
  // Cursos disponibles
  courses: {
    id: string
    title: string
    description: string
    category: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    difficulty: 1 | 2 | 3 | 4 | 5
    duration: number // en minutos
    lessons: string[]
    prerequisites: string[]
    rewards: {
      points: number
      badges: string[]
      certificates: string[]
    }
    isActive: boolean
    createdAt: number
    updatedAt: number
  }[]
  
  // Lecciones individuales
  lessons: {
    id: string
    courseId: string
    title: string
    content: string
    type: 'video' | 'text' | 'interactive' | 'quiz'
    duration: number
    order: number
    isRequired: boolean
    resources: {
      type: 'pdf' | 'video' | 'link' | 'code'
      title: string
      url: string
    }[]
    quiz?: {
      questions: {
        id: string
        question: string
        type: 'multiple-choice' | 'true-false' | 'fill-blank'
        options?: string[]
        correctAnswer: string | string[]
        explanation: string
      }[]
      passingScore: number
    }
  }[]
  
  // Progreso del usuario
  userProgress: {
    address: string
    courses: {
      courseId: string
      progress: number // 0-100
      completedLessons: string[]
      currentLesson: string
      startedAt: number
      completedAt?: number
      score?: number
      certificates: string[]
    }[]
    totalCoursesCompleted: number
    totalLessonsCompleted: number
    totalTimeSpent: number // en minutos
    achievements: string[]
    streak: number
    lastActivity: number
  }
  
  // Certificados
  certificates: {
    id: string
    courseId: string
    address: string
    issuedAt: number
    expiresAt?: number
    score: number
    status: 'active' | 'expired' | 'revoked'
    metadata: {
      courseTitle: string
      completionDate: string
      issuer: string
    }
  }[]
  
  // Logros educativos
  achievements: {
    id: string
    name: string
    description: string
    icon: string
    category: 'completion' | 'streak' | 'score' | 'social'
    criteria: {
      type: 'courses' | 'lessons' | 'streak' | 'score' | 'time'
      value: number
      timeframe?: number
    }
    rewards: {
      points: number
      badges: string[]
    }
    isUnlocked: boolean
    unlockedAt?: number
  }[]
  
  // Configuración del sistema
  config: {
    // Puntos por actividad educativa
    pointsPerActivity: {
      lessonCompleted: number
      courseCompleted: number
      quizPassed: number
      perfectScore: number
      dailyStreak: number
    }
    
    // Configuración de streak
    streakConfig: {
      maxStreak: number
      bonusMultiplier: number
      resetAfterDays: number
    }
    
    // Configuración de certificados
    certificateConfig: {
      validityDays: number
      minimumScore: number
      autoExpire: boolean
    }
  }
}

// Estado inicial con contenido educativo
const initialState: EducationalData = {
  courses: [
    {
      id: 'defi-basics',
      title: 'Fundamentos de DeFi',
      description: 'Aprende los conceptos básicos de las finanzas descentralizadas',
      category: 'beginner',
      difficulty: 1,
      duration: 120,
      lessons: ['defi-intro', 'blockchain-basics', 'smart-contracts', 'defi-protocols'],
      prerequisites: [],
      rewards: {
        points: 500,
        badges: ['defi-novice'],
        certificates: ['defi-basics-cert']
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'lending-protocols',
      title: 'Protocolos de Préstamos',
      description: 'Domina los protocolos de préstamos descentralizados',
      category: 'intermediate',
      difficulty: 3,
      duration: 180,
      lessons: ['lending-overview', 'collateral-types', 'liquidation-mechanics', 'risk-management'],
      prerequisites: ['defi-basics'],
      rewards: {
        points: 1000,
        badges: ['lending-expert'],
        certificates: ['lending-protocols-cert']
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'yield-farming',
      title: 'Yield Farming Avanzado',
      description: 'Estrategias avanzadas de yield farming y optimización',
      category: 'advanced',
      difficulty: 4,
      duration: 240,
      lessons: ['yield-strategies', 'impermanent-loss', 'defi-risks', 'portfolio-optimization'],
      prerequisites: ['defi-basics', 'lending-protocols'],
      rewards: {
        points: 2000,
        badges: ['yield-master'],
        certificates: ['yield-farming-cert']
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'defi-security',
      title: 'Seguridad en DeFi',
      description: 'Mejores prácticas de seguridad en DeFi',
      category: 'expert',
      difficulty: 5,
      duration: 300,
      lessons: ['security-basics', 'audit-process', 'risk-assessment', 'incident-response'],
      prerequisites: ['defi-basics', 'lending-protocols', 'yield-farming'],
      rewards: {
        points: 3000,
        badges: ['security-expert'],
        certificates: ['defi-security-cert']
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  lessons: [
    {
      id: 'defi-intro',
      courseId: 'defi-basics',
      title: 'Introducción a DeFi',
      content: 'Las finanzas descentralizadas (DeFi) representan una revolución en el sistema financiero tradicional...',
      type: 'video',
      duration: 15,
      order: 1,
      isRequired: true,
      resources: [
        {
          type: 'pdf',
          title: 'Guía de DeFi',
          url: '/resources/defi-guide.pdf'
        }
      ]
    },
    {
      id: 'blockchain-basics',
      courseId: 'defi-basics',
      title: 'Fundamentos de Blockchain',
      content: 'Blockchain es la tecnología que hace posible las finanzas descentralizadas...',
      type: 'text',
      duration: 20,
      order: 2,
      isRequired: true,
      resources: [],
      quiz: {
        questions: [
          {
            id: 'q1',
            question: '¿Qué es un bloque en blockchain?',
            type: 'multiple-choice',
            options: [
              'Un archivo de texto',
              'Una colección de transacciones',
              'Un tipo de criptomoneda',
              'Un servidor central'
            ],
            correctAnswer: 'Una colección de transacciones',
            explanation: 'Un bloque es una colección de transacciones que se agrupan y se añaden a la cadena de bloques.'
          }
        ],
        passingScore: 80
      }
    }
  ],
  userProgress: {
    address: '',
    courses: [],
    totalCoursesCompleted: 0,
    totalLessonsCompleted: 0,
    totalTimeSpent: 0,
    achievements: [],
    streak: 0,
    lastActivity: 0
  },
  certificates: [],
  achievements: [
    {
      id: 'first-course',
      name: 'Primer Curso Completado',
      description: 'Completa tu primer curso educativo',
      icon: '🎓',
      category: 'completion',
      criteria: { type: 'courses', value: 1 },
      rewards: { points: 100, badges: ['first-graduate'] },
      isUnlocked: false
    },
    {
      id: 'learning-streak',
      name: 'Racha de Aprendizaje',
      description: 'Mantén una racha de 7 días de aprendizaje',
      icon: '🔥',
      category: 'streak',
      criteria: { type: 'streak', value: 7 },
      rewards: { points: 200, badges: ['learning-streak'] },
      isUnlocked: false
    },
    {
      id: 'perfect-score',
      name: 'Puntuación Perfecta',
      description: 'Obtén 100% en un quiz',
      icon: '⭐',
      category: 'score',
      criteria: { type: 'score', value: 100 },
      rewards: { points: 150, badges: ['perfect-score'] },
      isUnlocked: false
    },
    {
      id: 'knowledge-master',
      name: 'Maestro del Conocimiento',
      description: 'Completa 10 cursos',
      icon: '🧠',
      category: 'completion',
      criteria: { type: 'courses', value: 10 },
      rewards: { points: 1000, badges: ['knowledge-master'] },
      isUnlocked: false
    }
  ],
  config: {
    pointsPerActivity: {
      lessonCompleted: 25,
      courseCompleted: 200,
      quizPassed: 50,
      perfectScore: 100,
      dailyStreak: 10
    },
    streakConfig: {
      maxStreak: 30,
      bonusMultiplier: 0.5,
      resetAfterDays: 2
    },
    certificateConfig: {
      validityDays: 365,
      minimumScore: 80,
      autoExpire: true
    }
  }
}

// Store principal
export const useEducationalStore = create<EducationalData & {
  actions: {
    // Iniciar curso
    startCourse: (courseId: string, address: string) => void
    
    // Completar lección
    completeLesson: (lessonId: string, address: string) => void
    
    // Tomar quiz
    takeQuiz: (lessonId: string, answers: Record<string, string>, address: string) => {
      score: number
      passed: boolean
      correctAnswers: number
      totalQuestions: number
    }
    
    // Completar curso
    completeCourse: (courseId: string, address: string) => void
    
    // Obtener progreso del curso
    getCourseProgress: (courseId: string, address: string) => {
      progress: number
      completedLessons: string[]
      currentLesson: string
      timeSpent: number
      score?: number
    }
    
    // Obtener cursos disponibles
    getAvailableCourses: (address: string) => any[]
    
    // Obtener lecciones del curso
    getCourseLessons: (courseId: string) => any[]
    
    // Verificar prerrequisitos
    checkPrerequisites: (courseId: string, address: string) => boolean
    
    // Obtener certificados
    getCertificates: (address: string) => any[]
    
    // Generar certificado
    generateCertificate: (courseId: string, address: string, score: number) => string
    
    // Verificar logros
    checkAchievements: (address: string) => void
    
    // Actualizar streak
    updateStreak: (address: string) => void
    
    // Obtener estadísticas educativas
    getEducationalStats: (address: string) => {
      totalCourses: number
      completedCourses: number
      totalLessons: number
      completedLessons: number
      totalTimeSpent: number
      averageScore: number
      streak: number
      achievements: number
      certificates: number
    }
    
    // Obtener recomendaciones
    getRecommendations: (address: string) => any[]
    
    // Buscar contenido
    searchContent: (query: string) => {
      courses: any[]
      lessons: any[]
    }
    
    // Resetear progreso
    resetProgress: (address: string) => void
  }
}>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      actions: {
        // Iniciar curso
        startCourse: (courseId: string, address: string) => {
          const course = get().courses.find(c => c.id === courseId)
          if (!course) return
          
          const existingProgress = get().userProgress.courses.find(
            c => c.courseId === courseId && c.address === address
          )
          
          if (existingProgress) return
          
          set((state) => ({
            userProgress: {
              ...state.userProgress,
              address,
              courses: [
                ...state.userProgress.courses,
                {
                  courseId,
                  progress: 0,
                  completedLessons: [],
                  currentLesson: course.lessons[0],
                  startedAt: Date.now(),
                  certificates: []
                }
              ],
              lastActivity: Date.now()
            }
          }))
        },
        
        // Completar lección
        completeLesson: (lessonId: string, address: string) => {
          const lesson = get().lessons.find(l => l.id === lessonId)
          if (!lesson) return
          
          set((state) => ({
            userProgress: {
              ...state.userProgress,
              courses: state.userProgress.courses.map(course => {
                if (course.courseId === lesson.courseId && course.address === address) {
                  const completedLessons = [...course.completedLessons, lessonId]
                  const progress = (completedLessons.length / get().lessons.filter(l => l.courseId === lesson.courseId).length) * 100
                  
                  return {
                    ...course,
                    completedLessons,
                    progress,
                    currentLesson: get().lessons.find(l => l.courseId === lesson.courseId && !completedLessons.includes(l.id))?.id || lessonId
                  }
                }
                return course
              }),
              totalLessonsCompleted: state.userProgress.totalLessonsCompleted + 1,
              totalTimeSpent: state.userProgress.totalTimeSpent + lesson.duration,
              lastActivity: Date.now()
            }
          }))
          
          // Verificar logros
          get().actions.checkAchievements(address)
        },
        
        // Tomar quiz
        takeQuiz: (lessonId: string, answers: Record<string, string>, address: string) => {
          const lesson = get().lessons.find(l => l.id === lessonId)
          if (!lesson?.quiz) {
            return { score: 0, passed: false, correctAnswers: 0, totalQuestions: 0 }
          }
          
          let correctAnswers = 0
          const totalQuestions = lesson.quiz.questions.length
          
          lesson.quiz.questions.forEach(question => {
            const userAnswer = answers[question.id]
            if (userAnswer === question.correctAnswer) {
              correctAnswers++
            }
          })
          
          const score = (correctAnswers / totalQuestions) * 100
          const passed = score >= lesson.quiz.passingScore
          
          // Completar lección si pasa el quiz
          if (passed) {
            get().actions.completeLesson(lessonId, address)
          }
          
          return { score, passed, correctAnswers, totalQuestions }
        },
        
        // Completar curso
        completeCourse: (courseId: string, address: string) => {
          const course = get().courses.find(c => c.id === courseId)
          if (!course) return
          
          set((state) => ({
            userProgress: {
              ...state.userProgress,
              courses: state.userProgress.courses.map(c => {
                if (c.courseId === courseId && c.address === address) {
                  return {
                    ...c,
                    progress: 100,
                    completedAt: Date.now()
                  }
                }
                return c
              }),
              totalCoursesCompleted: state.userProgress.totalCoursesCompleted + 1,
              lastActivity: Date.now()
            }
          }))
          
          // Generar certificado
          const certificateId = get().actions.generateCertificate(courseId, address, 100)
          
          // Verificar logros
          get().actions.checkAchievements(address)
        },
        
        // Obtener progreso del curso
        getCourseProgress: (courseId: string, address: string) => {
          const progress = get().userProgress.courses.find(
            c => c.courseId === courseId && c.address === address
          )
          
          if (!progress) {
            return {
              progress: 0,
              completedLessons: [],
              currentLesson: '',
              timeSpent: 0
            }
          }
          
          return {
            progress: progress.progress,
            completedLessons: progress.completedLessons,
            currentLesson: progress.currentLesson,
            timeSpent: progress.completedLessons.length * 15, // Estimación
            score: progress.score
          }
        },
        
        // Obtener cursos disponibles
        getAvailableCourses: (address: string) => {
          const userProgress = get().userProgress
          const completedCourses = userProgress.courses
            .filter(c => c.address === address && c.progress === 100)
            .map(c => c.courseId)
          
          return get().courses.filter(course => {
            if (!course.isActive) return false
            
            // Verificar prerrequisitos
            const prerequisitesMet = course.prerequisites.every(prereq => 
              completedCourses.includes(prereq)
            )
            
            return prerequisitesMet
          })
        },
        
        // Obtener lecciones del curso
        getCourseLessons: (courseId: string) => {
          return get().lessons
            .filter(l => l.courseId === courseId)
            .sort((a, b) => a.order - b.order)
        },
        
        // Verificar prerrequisitos
        checkPrerequisites: (courseId: string, address: string) => {
          const course = get().courses.find(c => c.id === courseId)
          if (!course) return false
          
          const completedCourses = get().userProgress.courses
            .filter(c => c.address === address && c.progress === 100)
            .map(c => c.courseId)
          
          return course.prerequisites.every(prereq => completedCourses.includes(prereq))
        },
        
        // Obtener certificados
        getCertificates: (address: string) => {
          return get().certificates.filter(c => c.address === address && c.status === 'active')
        },
        
        // Generar certificado
        generateCertificate: (courseId: string, address: string, score: number) => {
          const course = get().courses.find(c => c.id === courseId)
          if (!course) return ''
          
          const certificateId = `cert-${courseId}-${address}-${Date.now()}`
          const expiresAt = get().config.certificateConfig.validityDays * 24 * 60 * 60 * 1000
          
          set((state) => ({
            certificates: [
              {
                id: certificateId,
                courseId,
                address,
                issuedAt: Date.now(),
                expiresAt: Date.now() + expiresAt,
                score,
                status: 'active',
                metadata: {
                  courseTitle: course.title,
                  completionDate: new Date().toISOString(),
                  issuer: 'DeFi Core Academy'
                }
              },
              ...state.certificates
            ]
          }))
          
          return certificateId
        },
        
        // Verificar logros
        checkAchievements: (address: string) => {
          const userProgress = get().userProgress
          const achievements = get().achievements
          
          achievements.forEach(achievement => {
            if (achievement.isUnlocked) return
            
            let isUnlocked = false
            
            switch (achievement.criteria.type) {
              case 'courses':
                const completedCourses = userProgress.courses.filter(
                  c => c.address === address && c.progress === 100
                ).length
                isUnlocked = completedCourses >= achievement.criteria.value
                break
                
              case 'lessons':
                isUnlocked = userProgress.totalLessonsCompleted >= achievement.criteria.value
                break
                
              case 'streak':
                isUnlocked = userProgress.streak >= achievement.criteria.value
                break
                
              case 'score':
                // Simular puntuación perfecta
                const hasPerfectScore = userProgress.courses.some(
                  c => c.address === address && c.score === 100
                )
                isUnlocked = hasPerfectScore
                break
                
              case 'time':
                isUnlocked = userProgress.totalTimeSpent >= achievement.criteria.value
                break
            }
            
            if (isUnlocked) {
              set((state) => ({
                achievements: state.achievements.map(a => 
                  a.id === achievement.id 
                    ? { ...a, isUnlocked: true, unlockedAt: Date.now() }
                    : a
                ),
                userProgress: {
                  ...state.userProgress,
                  achievements: [...state.userProgress.achievements, achievement.id]
                }
              }))
            }
          })
        },
        
        // Actualizar streak
        updateStreak: (address: string) => {
          const userProgress = get().userProgress
          const now = Date.now()
          const lastActivity = userProgress.lastActivity
          const daysSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60 * 24)
          
          if (daysSinceLastActivity <= get().config.streakConfig.resetAfterDays) {
            set((state) => ({
              userProgress: {
                ...state.userProgress,
                streak: state.userProgress.streak + 1
              }
            }))
          } else {
            set((state) => ({
              userProgress: {
                ...state.userProgress,
                streak: 1
              }
            }))
          }
          
          // Verificar logros después de actualizar streak
          get().actions.checkAchievements(address)
        },
        
        // Obtener estadísticas educativas
        getEducationalStats: (address: string) => {
          const userProgress = get().userProgress
          const userCourses = userProgress.courses.filter(c => c.address === address)
          const completedCourses = userCourses.filter(c => c.progress === 100)
          
          const totalScore = completedCourses.reduce((sum, c) => sum + (c.score || 0), 0)
          const averageScore = completedCourses.length > 0 ? totalScore / completedCourses.length : 0
          
          return {
            totalCourses: get().courses.length,
            completedCourses: completedCourses.length,
            totalLessons: get().lessons.length,
            completedLessons: userProgress.totalLessonsCompleted,
            totalTimeSpent: userProgress.totalTimeSpent,
            averageScore,
            streak: userProgress.streak,
            achievements: userProgress.achievements.length,
            certificates: get().certificates.filter(c => c.address === address && c.status === 'active').length
          }
        },
        
        // Obtener recomendaciones
        getRecommendations: (address: string) => {
          const availableCourses = get().actions.getAvailableCourses(address)
          const userProgress = get().userProgress
          const completedCourses = userProgress.courses
            .filter(c => c.address === address && c.progress === 100)
            .map(c => c.courseId)
          
          // Recomendar cursos basados en nivel y progreso
          return availableCourses
            .filter(course => !completedCourses.includes(course.id))
            .sort((a, b) => a.difficulty - b.difficulty)
            .slice(0, 3)
        },
        
        // Buscar contenido
        searchContent: (query: string) => {
          const lowerQuery = query.toLowerCase()
          
          const courses = get().courses.filter(course =>
            course.title.toLowerCase().includes(lowerQuery) ||
            course.description.toLowerCase().includes(lowerQuery)
          )
          
          const lessons = get().lessons.filter(lesson =>
            lesson.title.toLowerCase().includes(lowerQuery) ||
            lesson.content.toLowerCase().includes(lowerQuery)
          )
          
          return { courses, lessons }
        },
        
        // Resetear progreso
        resetProgress: (address: string) => {
          set((state) => ({
            userProgress: {
              ...state.userProgress,
              courses: state.userProgress.courses.filter(c => c.address !== address),
              totalCoursesCompleted: 0,
              totalLessonsCompleted: 0,
              totalTimeSpent: 0,
              achievements: [],
              streak: 0
            }
          }))
        }
      }
    })),
    {
      name: 'educational-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        courses: state.courses,
        lessons: state.lessons,
        userProgress: state.userProgress,
        certificates: state.certificates,
        achievements: state.achievements,
        config: state.config
      })
    }
  )
)
