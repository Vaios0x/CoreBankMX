import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

// Tipos para el sistema de chat de soporte
export interface SupportChatData {
  // Tickets de soporte
  tickets: {
    id: string
    address: string
    subject: string
    description: string
    category: 'technical' | 'financial' | 'general' | 'bug' | 'feature'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'open' | 'in-progress' | 'resolved' | 'closed'
    assignedTo?: string
    createdAt: number
    updatedAt: number
    resolvedAt?: number
    tags: string[]
  }[]
  
  // Mensajes de chat
  messages: {
    id: string
    ticketId: string
    sender: {
      type: 'user' | 'agent' | 'bot'
      id: string
      name: string
      avatar?: string
    }
    content: string
    type: 'text' | 'image' | 'file' | 'system'
    timestamp: number
    isRead: boolean
    metadata?: {
      fileUrl?: string
      fileName?: string
      fileSize?: number
      systemAction?: string
    }
  }[]
  
  // Agentes de soporte
  agents: {
    id: string
    name: string
    email: string
    avatar?: string
    status: 'online' | 'offline' | 'busy' | 'away'
    specialties: string[]
    rating: number
    totalTickets: number
    averageResponseTime: number
    isAvailable: boolean
  }[]
  
  // Configuración del bot de IA
  aiBot: {
    isEnabled: boolean
    name: string
    avatar: string
    capabilities: {
      autoResponse: boolean
      ticketClassification: boolean
      sentimentAnalysis: boolean
      knowledgeBase: boolean
      escalation: boolean
    }
    responses: {
      greeting: string
      busy: string
      escalation: string
      resolution: string
    }
    knowledgeBase: {
      id: string
      question: string
      answer: string
      category: string
      tags: string[]
      confidence: number
    }[]
  }
  
  // Configuración del sistema
  config: {
    // Configuración de tickets
    ticketConfig: {
      autoAssign: boolean
      maxOpenTickets: number
      responseTimeThreshold: number // en minutos
      escalationTime: number // en minutos
    }
    
    // Configuración de chat
    chatConfig: {
      maxMessageLength: number
      fileUploadEnabled: boolean
      maxFileSize: number
      allowedFileTypes: string[]
      typingIndicator: boolean
      readReceipts: boolean
    }
    
    // Configuración de IA
    aiConfig: {
      autoResponseDelay: number // en segundos
      confidenceThreshold: number
      maxContextMessages: number
      enableSentimentAnalysis: boolean
    }
  }
}

// Estado inicial
const initialState: SupportChatData = {
  tickets: [],
  messages: [],
  agents: [
    {
      id: 'agent-1',
      name: 'María García',
      email: 'maria@defi-core.com',
      avatar: '/avatars/agent-1.png',
      status: 'online',
      specialties: ['technical', 'financial'],
      rating: 4.8,
      totalTickets: 1250,
      averageResponseTime: 5,
      isAvailable: true
    },
    {
      id: 'agent-2',
      name: 'Carlos Rodríguez',
      email: 'carlos@defi-core.com',
      avatar: '/avatars/agent-2.png',
      status: 'online',
      specialties: ['bug', 'feature'],
      rating: 4.9,
      totalTickets: 980,
      averageResponseTime: 3,
      isAvailable: true
    },
    {
      id: 'agent-3',
      name: 'Ana Martínez',
      email: 'ana@defi-core.com',
      avatar: '/avatars/agent-3.png',
      status: 'busy',
      specialties: ['general', 'technical'],
      rating: 4.7,
      totalTickets: 2100,
      averageResponseTime: 7,
      isAvailable: false
    }
  ],
  aiBot: {
    isEnabled: true,
    name: 'DeFi Assistant',
    avatar: '/avatars/bot-avatar.png',
    capabilities: {
      autoResponse: true,
      ticketClassification: true,
      sentimentAnalysis: true,
      knowledgeBase: true,
      escalation: true
    },
    responses: {
      greeting: '¡Hola! Soy DeFi Assistant, tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      busy: 'Estamos experimentando un alto volumen de consultas. Un agente te atenderá pronto.',
      escalation: 'Te estoy conectando con un agente especializado para ayudarte mejor.',
      resolution: '¡Me alegra haber podido ayudarte! ¿Hay algo más en lo que pueda asistirte?'
    },
    knowledgeBase: [
      {
        id: 'kb-1',
        question: '¿Cómo puedo solicitar un préstamo?',
        answer: 'Para solicitar un préstamo, ve a la sección "Borrow", conecta tu wallet, selecciona el monto y confirma la transacción.',
        category: 'lending',
        tags: ['préstamo', 'borrow', 'wallet'],
        confidence: 0.95
      },
      {
        id: 'kb-2',
        question: '¿Cuáles son las comisiones?',
        answer: 'Las comisiones varían según el tipo de transacción. Consulta nuestra página de tarifas para más detalles.',
        category: 'fees',
        tags: ['comisiones', 'tarifas', 'costos'],
        confidence: 0.90
      },
      {
        id: 'kb-3',
        question: '¿Cómo funciona el sistema de referral?',
        answer: 'Invita amigos usando tu código de referral y gana comisiones por sus transacciones.',
        category: 'referral',
        tags: ['referral', 'invitar', 'comisiones'],
        confidence: 0.88
      },
      {
        id: 'kb-4',
        question: '¿Qué es el Health Factor?',
        answer: 'El Health Factor indica la salud de tu posición. Mantenlo por encima de 1.0 para evitar liquidaciones.',
        category: 'technical',
        tags: ['health factor', 'liquidación', 'posición'],
        confidence: 0.92
      },
      {
        id: 'kb-5',
        question: '¿Cómo puedo retirar mis fondos?',
        answer: 'Ve a "Positions", selecciona la posición y usa "Withdraw" para retirar tus fondos.',
        category: 'withdrawal',
        tags: ['retirar', 'withdraw', 'fondos'],
        confidence: 0.94
      }
    ]
  },
  config: {
    ticketConfig: {
      autoAssign: true,
      maxOpenTickets: 5,
      responseTimeThreshold: 30,
      escalationTime: 60
    },
    chatConfig: {
      maxMessageLength: 1000,
      fileUploadEnabled: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/*', 'application/pdf', 'text/plain'],
      typingIndicator: true,
      readReceipts: true
    },
    aiConfig: {
      autoResponseDelay: 2,
      confidenceThreshold: 0.7,
      maxContextMessages: 10,
      enableSentimentAnalysis: true
    }
  }
}

// Store principal
export const useSupportChatStore = create<SupportChatData & {
  actions: {
    // Crear ticket
    createTicket: (data: {
      address: string
      subject: string
      description: string
      category: 'technical' | 'financial' | 'general' | 'bug' | 'feature'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
    }) => string
    
    // Enviar mensaje
    sendMessage: (data: {
      ticketId: string
      content: string
      senderType: 'user' | 'agent' | 'bot'
      senderId: string
      senderName: string
      type?: 'text' | 'image' | 'file' | 'system'
      metadata?: any
    }) => void
    
    // Obtener mensajes del ticket
    getTicketMessages: (ticketId: string) => any[]
    
    // Obtener tickets del usuario
    getUserTickets: (address: string) => any[]
    
    // Actualizar estado del ticket
    updateTicketStatus: (ticketId: string, status: 'open' | 'in-progress' | 'resolved' | 'closed') => void
    
    // Asignar agente
    assignAgent: (ticketId: string, agentId: string) => void
    
    // Obtener agentes disponibles
    getAvailableAgents: () => any[]
    
    // Respuesta automática del bot
    getBotResponse: (message: string, context: any[]) => {
      response: string
      confidence: number
      shouldEscalate: boolean
    }
    
    // Clasificar ticket
    classifyTicket: (description: string) => {
      category: string
      priority: string
      confidence: number
    }
    
    // Analizar sentimiento
    analyzeSentiment: (message: string) => {
      sentiment: 'positive' | 'negative' | 'neutral'
      confidence: number
    }
    
    // Buscar en base de conocimiento
    searchKnowledgeBase: (query: string) => any[]
    
    // Obtener estadísticas
    getSupportStats: (address?: string) => {
      totalTickets: number
      openTickets: number
      resolvedTickets: number
      averageResponseTime: number
      satisfactionRate: number
    }
    
    // Marcar mensaje como leído
    markMessageAsRead: (messageId: string) => void
    
    // Obtener tickets no leídos
    getUnreadTickets: (address: string) => any[]
    
    // Escalar ticket
    escalateTicket: (ticketId: string, reason: string) => void
    
    // Cerrar ticket
    closeTicket: (ticketId: string, resolution: string) => void
    
    // Obtener historial de chat
    getChatHistory: (ticketId: string, limit?: number) => any[]
    
    // Resetear estado
    reset: () => void
  }
}>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      actions: {
        // Crear ticket de soporte
        createTicket: (data) => {
          const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const now = Date.now()
          
          // Clasificar automáticamente el ticket
          const classification = get().actions.classifyTicket(data.description)
          
          const ticket = {
            id: ticketId,
            address: data.address,
            subject: data.subject,
            description: data.description,
            category: data.category,
            priority: data.priority || classification.priority,
            status: 'open' as const,
            createdAt: now,
            updatedAt: now,
            tags: []
          }
          
          set((state) => ({
            tickets: [ticket, ...state.tickets]
          }))
          
          // Enviar mensaje inicial del bot
          if (get().aiBot.isEnabled) {
            setTimeout(() => {
              get().actions.sendMessage({
                ticketId,
                content: get().aiBot.responses.greeting,
                senderType: 'bot',
                senderId: 'ai-bot',
                senderName: get().aiBot.name,
                type: 'system'
              })
            }, get().config.aiConfig.autoResponseDelay * 1000)
          }
          
          return ticketId
        },
        
        // Enviar mensaje
        sendMessage: (data) => {
          const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ticketId: data.ticketId,
            sender: {
              type: data.senderType,
              id: data.senderId,
              name: data.senderName
            },
            content: data.content,
            type: data.type || 'text',
            timestamp: Date.now(),
            isRead: false,
            metadata: data.metadata
          }
          
          set((state) => ({
            messages: [message, ...state.messages],
            tickets: state.tickets.map(ticket => 
              ticket.id === data.ticketId 
                ? { ...ticket, updatedAt: Date.now() }
                : ticket
            )
          }))
          
          // Respuesta automática del bot si es mensaje de usuario
          if (data.senderType === 'user' && get().aiBot.isEnabled) {
            const context = get().actions.getChatHistory(data.ticketId, get().config.aiConfig.maxContextMessages)
            const botResponse = get().actions.getBotResponse(data.content, context)
            
            setTimeout(() => {
              get().actions.sendMessage({
                ticketId: data.ticketId,
                content: botResponse.response,
                senderType: 'bot',
                senderId: 'ai-bot',
                senderName: get().aiBot.name,
                type: 'text'
              })
              
              // Escalar si es necesario
              if (botResponse.shouldEscalate) {
                get().actions.escalateTicket(data.ticketId, 'Escalado automático por IA')
              }
            }, get().config.aiConfig.autoResponseDelay * 1000)
          }
        },
        
        // Obtener mensajes del ticket
        getTicketMessages: (ticketId: string) => {
          return get().messages
            .filter(m => m.ticketId === ticketId)
            .sort((a, b) => a.timestamp - b.timestamp)
        },
        
        // Obtener tickets del usuario
        getUserTickets: (address: string) => {
          return get().tickets
            .filter(t => t.address === address)
            .sort((a, b) => b.updatedAt - a.updatedAt)
        },
        
        // Actualizar estado del ticket
        updateTicketStatus: (ticketId: string, status) => {
          set((state) => ({
            tickets: state.tickets.map(ticket => 
              ticket.id === ticketId 
                ? { 
                    ...ticket, 
                    status, 
                    updatedAt: Date.now(),
                    resolvedAt: status === 'resolved' ? Date.now() : ticket.resolvedAt
                  }
                : ticket
            )
          }))
        },
        
        // Asignar agente
        assignAgent: (ticketId: string, agentId: string) => {
          set((state) => ({
            tickets: state.tickets.map(ticket => 
              ticket.id === ticketId 
                ? { ...ticket, assignedTo: agentId, updatedAt: Date.now() }
                : ticket
            )
          }))
        },
        
        // Obtener agentes disponibles
        getAvailableAgents: () => {
          return get().agents.filter(agent => agent.isAvailable && agent.status === 'online')
        },
        
        // Respuesta automática del bot
        getBotResponse: (message: string, context: any[]) => {
          const lowerMessage = message.toLowerCase()
          
          // Buscar en base de conocimiento
          const knowledgeResults = get().actions.searchKnowledgeBase(message)
          
          if (knowledgeResults.length > 0 && knowledgeResults[0].confidence >= get().config.aiConfig.confidenceThreshold) {
            return {
              response: knowledgeResults[0].answer,
              confidence: knowledgeResults[0].confidence,
              shouldEscalate: false
            }
          }
          
          // Análisis de sentimiento
          const sentiment = get().actions.analyzeSentiment(message)
          
          // Respuestas basadas en palabras clave
          if (lowerMessage.includes('préstamo') || lowerMessage.includes('borrow')) {
            return {
              response: 'Para solicitar un préstamo, ve a la sección "Borrow" en el menú principal. ¿Te gustaría que te guíe paso a paso?',
              confidence: 0.8,
              shouldEscalate: false
            }
          }
          
          if (lowerMessage.includes('error') || lowerMessage.includes('problema') || lowerMessage.includes('bug')) {
            return {
              response: 'Entiendo que tienes un problema técnico. Te estoy conectando con un agente especializado para ayudarte mejor.',
              confidence: 0.6,
              shouldEscalate: true
            }
          }
          
          if (lowerMessage.includes('comisión') || lowerMessage.includes('tarifa') || lowerMessage.includes('costo')) {
            return {
              response: 'Las comisiones varían según el tipo de transacción. ¿Te gustaría que revise las tarifas específicas para tu caso?',
              confidence: 0.7,
              shouldEscalate: false
            }
          }
          
          // Respuesta genérica
          return {
            response: 'Entiendo tu consulta. Déjame buscar la información más relevante para ayudarte.',
            confidence: 0.3,
            shouldEscalate: true
          }
        },
        
        // Clasificar ticket
        classifyTicket: (description: string) => {
          const lowerDesc = description.toLowerCase()
          
          // Clasificación por categoría
          let category = 'general'
          let priority = 'medium'
          let confidence = 0.5
          
          if (lowerDesc.includes('error') || lowerDesc.includes('bug') || lowerDesc.includes('fallo')) {
            category = 'bug'
            priority = 'high'
            confidence = 0.8
          } else if (lowerDesc.includes('préstamo') || lowerDesc.includes('deuda') || lowerDesc.includes('liquidación')) {
            category = 'financial'
            priority = 'high'
            confidence = 0.9
          } else if (lowerDesc.includes('wallet') || lowerDesc.includes('conectar') || lowerDesc.includes('transacción')) {
            category = 'technical'
            priority = 'medium'
            confidence = 0.7
          } else if (lowerDesc.includes('nueva') || lowerDesc.includes('funcionalidad') || lowerDesc.includes('feature')) {
            category = 'feature'
            priority = 'low'
            confidence = 0.6
          }
          
          // Ajustar prioridad por palabras clave
          if (lowerDesc.includes('urgente') || lowerDesc.includes('crítico') || lowerDesc.includes('emergencia')) {
            priority = 'urgent'
            confidence += 0.2
          }
          
          return { category, priority, confidence: Math.min(confidence, 1.0) }
        },
        
        // Analizar sentimiento
        analyzeSentiment: (message: string) => {
          const lowerMessage = message.toLowerCase()
          const positiveWords = ['gracias', 'excelente', 'perfecto', 'genial', 'bueno', 'ayuda']
          const negativeWords = ['error', 'problema', 'malo', 'terrible', 'molesto', 'frustrado']
          
          let positiveCount = 0
          let negativeCount = 0
          
          positiveWords.forEach(word => {
            if (lowerMessage.includes(word)) positiveCount++
          })
          
          negativeWords.forEach(word => {
            if (lowerMessage.includes(word)) negativeCount++
          })
          
          if (positiveCount > negativeCount) {
            return { sentiment: 'positive' as const, confidence: 0.7 }
          } else if (negativeCount > positiveCount) {
            return { sentiment: 'negative' as const, confidence: 0.7 }
          } else {
            return { sentiment: 'neutral' as const, confidence: 0.5 }
          }
        },
        
        // Buscar en base de conocimiento
        searchKnowledgeBase: (query: string) => {
          const lowerQuery = query.toLowerCase()
          
          return get().aiBot.knowledgeBase
            .map(kb => {
              const questionMatch = kb.question.toLowerCase().includes(lowerQuery) ? 1 : 0
              const answerMatch = kb.answer.toLowerCase().includes(lowerQuery) ? 0.5 : 0
              const tagMatch = kb.tags.some(tag => lowerQuery.includes(tag.toLowerCase())) ? 0.3 : 0
              
              const relevance = questionMatch + answerMatch + tagMatch
              
              return {
                ...kb,
                relevance
              }
            })
            .filter(kb => kb.relevance > 0)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 3)
        },
        
        // Obtener estadísticas
        getSupportStats: (address?: string) => {
          const tickets = address 
            ? get().tickets.filter(t => t.address === address)
            : get().tickets
          
          const totalTickets = tickets.length
          const openTickets = tickets.filter(t => t.status === 'open').length
          const resolvedTickets = tickets.filter(t => t.status === 'resolved').length
          
          // Calcular tiempo promedio de respuesta (simulado)
          const averageResponseTime = 15 // minutos
          
          // Calcular tasa de satisfacción (simulado)
          const satisfactionRate = 0.92
          
          return {
            totalTickets,
            openTickets,
            resolvedTickets,
            averageResponseTime,
            satisfactionRate
          }
        },
        
        // Marcar mensaje como leído
        markMessageAsRead: (messageId: string) => {
          set((state) => ({
            messages: state.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, isRead: true }
                : msg
            )
          }))
        },
        
        // Obtener tickets no leídos
        getUnreadTickets: (address: string) => {
          const userTickets = get().actions.getUserTickets(address)
          
          return userTickets.filter(ticket => {
            const messages = get().actions.getTicketMessages(ticket.id)
            const unreadMessages = messages.filter(msg => 
              msg.sender.type !== 'user' && !msg.isRead
            )
            return unreadMessages.length > 0
          })
        },
        
        // Escalar ticket
        escalateTicket: (ticketId: string, reason: string) => {
          const availableAgents = get().actions.getAvailableAgents()
          
          if (availableAgents.length > 0) {
            const agent = availableAgents[0]
            get().actions.assignAgent(ticketId, agent.id)
            get().actions.updateTicketStatus(ticketId, 'in-progress')
            
            get().actions.sendMessage({
              ticketId,
              content: `Ticket escalado a ${agent.name}. ${reason}`,
              senderType: 'system',
              senderId: 'system',
              senderName: 'Sistema',
              type: 'system'
            })
          }
        },
        
        // Cerrar ticket
        closeTicket: (ticketId: string, resolution: string) => {
          get().actions.updateTicketStatus(ticketId, 'resolved')
          
          get().actions.sendMessage({
            ticketId,
            content: `Ticket resuelto: ${resolution}`,
            senderType: 'system',
            senderId: 'system',
            senderName: 'Sistema',
            type: 'system'
          })
        },
        
        // Obtener historial de chat
        getChatHistory: (ticketId: string, limit = 50) => {
          return get().messages
            .filter(m => m.ticketId === ticketId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit)
        },
        
        // Resetear estado
        reset: () => set(initialState)
      }
    })),
    {
      name: 'support-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tickets: state.tickets,
        messages: state.messages,
        agents: state.agents,
        aiBot: state.aiBot,
        config: state.config
      })
    }
  )
)
