import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useI18n } from '../i18n/i18n'
import { useSupportChatStore } from '../state/useSupportChatStore'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { motion } from 'framer-motion'
import { formatNumber } from '../lib/format'
import { useToastStore } from '../components/ui/Toast'

export function SupportChat() {
  const { address } = useAccount()
  const t = useI18n()
  const { push } = useToastStore()
  const { tickets, messages, agents, aiBot, config, actions } = useSupportChatStore()
  
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general' as const,
    priority: 'medium' as const
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Obtener tickets del usuario
  const userTickets = address ? actions.getUserTickets(address) : []
  const unreadTickets = address ? actions.getUnreadTickets(address) : []
  const supportStats = address ? actions.getSupportStats(address) : {
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    averageResponseTime: 0,
    satisfactionRate: 0
  }

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedTicket, messages])

  // Manejar envío de mensaje
  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim() || !address) return

    actions.sendMessage({
      ticketId: selectedTicket,
      content: newMessage.trim(),
      senderType: 'user',
      senderId: address,
      senderName: 'Usuario'
    })

    setNewMessage('')
  }

  // Manejar creación de ticket
  const handleCreateTicket = () => {
    if (!address || !ticketForm.subject.trim() || !ticketForm.description.trim()) {
      push({ type: 'error', message: 'Por favor completa todos los campos' })
      return
    }

    setIsCreatingTicket(true)
    try {
      const ticketId = actions.createTicket({
        address,
        subject: ticketForm.subject,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: ticketForm.priority
      })

      setSelectedTicket(ticketId)
      setTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' })
      setIsCreatingTicket(false)
      push({ type: 'success', message: 'Ticket creado exitosamente' })
    } catch (error) {
      setIsCreatingTicket(false)
      push({ type: 'error', message: 'Error al crear ticket' })
    }
  }

  // Obtener color de prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-orange-500'
      case 'urgent': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Obtener color de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500'
      case 'in-progress': return 'bg-yellow-500'
      case 'resolved': return 'bg-green-500'
      case 'closed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Obtener color de categoría
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'financial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'general': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'bug': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'feature': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('support.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('support.subtitle')}
          </p>
        </div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-2"
        >
          <Badge className="bg-green-500 text-white">
            {aiBot.isEnabled ? 'IA Activa' : 'IA Inactiva'}
          </Badge>
          {unreadTickets.length > 0 && (
            <Badge className="bg-red-500 text-white">
              {formatNumber(unreadTickets.length)} sin leer
            </Badge>
          )}
        </motion.div>
      </div>

      {/* Estadísticas de soporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tickets Totales
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(supportStats.totalTickets)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tickets Abiertos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(supportStats.openTickets)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tiempo Respuesta
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(supportStats.averageResponseTime)} min
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Satisfacción
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(supportStats.satisfactionRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de tickets */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mis Tickets
              </h3>
              <button
                onClick={() => setTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' })}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Nuevo Ticket
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedTicket(ticket.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTicket === ticket.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {ticket.subject}
                    </h4>
                    <div className="flex space-x-1">
                      <Badge className={`${getPriorityColor(ticket.priority)} text-white text-xs`}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(ticket.status)} text-white text-xs`}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {ticket.description.substring(0, 50)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(ticket.category)}>
                      {ticket.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
              {userTickets.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">
                    No tienes tickets aún
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Chat y formulario de ticket */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            /* Chat del ticket */
            <Card className="p-6 h-96 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ticket #{selectedTicket.slice(-8)}
                </h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {actions.getTicketMessages(selectedTicket).map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                      message.sender.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.sender.type === 'bot'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.sender.name}
                        </span>
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
              </div>
            </Card>
          ) : (
            /* Formulario de nuevo ticket */
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Crear Nuevo Ticket
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asunto
                  </label>
                  <Input
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    placeholder="Describe brevemente tu problema"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    placeholder="Proporciona detalles sobre tu consulta o problema"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="general">General</option>
                      <option value="technical">Técnico</option>
                      <option value="financial">Financiero</option>
                      <option value="bug">Error/Bug</option>
                      <option value="feature">Nueva Funcionalidad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCreateTicket}
                  disabled={isCreatingTicket || !ticketForm.subject.trim() || !ticketForm.description.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingTicket ? 'Creando...' : 'Crear Ticket'}
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Agentes disponibles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Equipo de Soporte
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                    {agent.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {agent.name}
                  </h4>
                  <Badge className={`${
                    agent.status === 'online' ? 'bg-green-500' :
                    agent.status === 'busy' ? 'bg-yellow-500' :
                    agent.status === 'away' ? 'bg-orange-500' :
                    'bg-gray-500'
                  } text-white text-xs`}>
                    {agent.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Especialidades:</strong> {agent.specialties.join(', ')}</p>
                <p><strong>Calificación:</strong> ⭐ {agent.rating}/5</p>
                <p><strong>Tickets atendidos:</strong> {formatNumber(agent.totalTickets)}</p>
                <p><strong>Tiempo respuesta:</strong> {formatNumber(agent.averageResponseTime)} min</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Información del bot de IA */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {aiBot.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Asistente virtual disponible 24/7 para ayudarte con consultas rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(aiBot.capabilities).map(([capability, enabled]) => (
                <Badge key={capability} className={`${enabled ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs`}>
                  {capability.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
