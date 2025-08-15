import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { env } from '../lib/env'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export function useWebSocket(
  endpoint: string = '/dashboard',
  options: UseWebSocketOptions = {}
) {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      const socket = io(`${env.API_URL}${endpoint}`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      })

      socket.on('connect', () => {
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      })

      socket.on('disconnect', (reason) => {
        setIsConnected(false)
        setIsConnecting(false)
        onDisconnect?.()

        // Reconexión automática
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, reconnectDelay * Math.pow(2, reconnectAttemptsRef.current))
        }
      })

      socket.on('error', (err) => {
        setError(err)
        onError?.(err)
      })

      socket.on('message', (message: WebSocketMessage) => {
        const newMessage = {
          ...message,
          timestamp: Date.now()
        }
        
        setMessages(prev => [...prev.slice(-99), newMessage]) // Mantener solo los últimos 100 mensajes
        onMessage?.(newMessage)
      })

      // Eventos específicos del dashboard
      socket.on('price_update', (data) => {
        const message: WebSocketMessage = {
          type: 'price_update',
          data,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev.slice(-99), message])
        onMessage?.(message)
      })

      socket.on('tvl_update', (data) => {
        const message: WebSocketMessage = {
          type: 'tvl_update',
          data,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev.slice(-99), message])
        onMessage?.(message)
      })

      socket.on('liquidation_event', (data) => {
        const message: WebSocketMessage = {
          type: 'liquidation_event',
          data,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev.slice(-99), message])
        onMessage?.(message)
      })

      socket.on('position_update', (data) => {
        const message: WebSocketMessage = {
          type: 'position_update',
          data,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev.slice(-99), message])
        onMessage?.(message)
      })

      socketRef.current = socket

      if (autoConnect) {
        socket.connect()
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create WebSocket connection')
      setError(error)
      onError?.(error)
      setIsConnecting(false)
    }
  }, [endpoint, autoConnect, reconnectAttempts, reconnectDelay, onConnect, onDisconnect, onError, onMessage, isConnecting])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttemptsRef.current = 0
  }, [])

  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', { type, data, timestamp: Date.now() })
    }
  }, [])

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const unsubscribe = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback)
      } else {
        socketRef.current.off(event)
      }
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, autoConnect])

  return {
    isConnected,
    isConnecting,
    error,
    messages,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    socket: socketRef.current
  }
}
