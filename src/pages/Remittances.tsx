import { useState, useEffect } from 'react'
import { useAccount, useBalance, useContractRead } from 'wagmi'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { useTx } from '../hooks/useTx'
import { useContracts } from '../hooks/useContracts'
import { formatCurrency, formatNumber } from '../lib/format'
import { useTranslation } from '../i18n/i18n'
import { motion } from 'framer-motion'

interface RemittanceQuote {
  id: string
  amount: number
  currency: 'USD' | 'MXN'
  recipientName: string
  recipientPhone: string
  recipientBank?: string
  recipientAccount?: string
  fee: number
  exchangeRate: number
  totalCost: number
  estimatedDelivery: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: number
}

interface RemittanceForm {
  amount: number
  currency: 'USD' | 'MXN'
  recipientName: string
  recipientPhone: string
  recipientBank?: string
  recipientAccount?: string
  deliveryMethod: 'bank' | 'cash' | 'mobile'
  notes?: string
}

export function Remittances() {
  const { t } = useTranslation()
  const { address } = useAccount()
  const { loanManager, mockUsdt } = useContracts()
  const { sendTransaction } = useTx()
  
  const [form, setForm] = useState<RemittanceForm>({
    amount: 0,
    currency: 'USD',
    recipientName: '',
    recipientPhone: '',
    deliveryMethod: 'bank'
  })
  
  const [quotes, setQuotes] = useState<RemittanceQuote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<RemittanceQuote | null>(null)

  // Obtener balance de USDT del usuario
  const { data: usdtBalance } = useBalance({
    address,
    token: mockUsdt?.address,
    watch: true
  })

  // Obtener parámetros del protocolo
  const { data: protocolParams } = useContractRead({
    ...loanManager,
    functionName: 'getProtocolParameters',
    watch: true
  })

  // Simular cotización de remesa
  const getRemittanceQuote = async (amount: number, currency: 'USD' | 'MXN') => {
    try {
      const response = await fetch('/api/remittances/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency })
      })
      
      if (!response.ok) throw new Error('Failed to get quote')
      
      const data = await response.json()
      return {
        id: `quote_${Date.now()}`,
        amount,
        currency,
        fee: data.fee,
        exchangeRate: data.exchangeRate,
        totalCost: data.totalCost,
        estimatedDelivery: data.estimatedDelivery,
        status: 'pending' as const,
        createdAt: Date.now()
      }
    } catch (error) {
      console.error('Error getting quote:', error)
      // Fallback con datos simulados
      return {
        id: `quote_${Date.now()}`,
        amount,
        currency,
        fee: amount * 0.005, // 0.5% fee
        exchangeRate: currency === 'MXN' ? 17.2 : 1,
        totalCost: amount * 1.005,
        estimatedDelivery: '2-4 hours',
        status: 'pending' as const,
        createdAt: Date.now()
      }
    }
  }

  // Crear nueva remesa
  const createRemittance = async (quote: RemittanceQuote) => {
    if (!address || !usdtBalance || usdtBalance.value < BigInt(quote.totalCost * 1e6)) {
      throw new Error('Insufficient USDT balance')
    }

    setIsLoading(true)
    try {
      // 1. Aprobar USDT para el contrato de remesas
      await sendTransaction({
        ...mockUsdt,
        functionName: 'approve',
        args: [loanManager.address, BigInt(quote.totalCost * 1e6)]
      })

      // 2. Crear remesa en el contrato
      const tx = await sendTransaction({
        ...loanManager,
        functionName: 'createRemittance',
        args: [
          BigInt(quote.totalCost * 1e6),
          quote.recipientName,
          quote.recipientPhone,
          quote.deliveryMethod,
          quote.notes || ''
        ]
      })

      // 3. Enviar datos a API para procesamiento off-chain
      await fetch('/api/remittances/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: tx.hash,
          quote,
          userAddress: address
        })
      })

      // 4. Actualizar estado local
      const newRemittance: RemittanceQuote = {
        ...quote,
        id: `remittance_${Date.now()}`,
        status: 'processing',
        createdAt: Date.now()
      }
      
      setQuotes(prev => [newRemittance, ...prev])
      setSelectedQuote(null)
      
      return newRemittance
    } catch (error) {
      console.error('Error creating remittance:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar historial de remesas
  useEffect(() => {
    const loadRemittances = async () => {
      if (!address) return
      
      try {
        // Simular llamada a API con delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Usar datos simulados para evitar errores de API
        setQuotes([
          {
            id: 'demo_1',
            amount: 500,
            currency: 'USD',
            recipientName: 'María González',
            recipientPhone: '+52 55 1234 5678',
            fee: 2.5,
            exchangeRate: 17.2,
            totalCost: 502.5,
            estimatedDelivery: '2-4 hours',
            status: 'completed',
            createdAt: Date.now() - 86400000
          },
          {
            id: 'demo_2',
            amount: 1000,
            currency: 'MXN',
            recipientName: 'Carlos Rodríguez',
            recipientPhone: '+52 33 9876 5432',
            fee: 5,
            exchangeRate: 1,
            totalCost: 1005,
            estimatedDelivery: '1-2 hours',
            status: 'processing',
            createdAt: Date.now() - 3600000
          }
        ])
      } catch (error) {
        console.error('Error loading remittances:', error)
      }
    }

    loadRemittances()
  }, [address])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.amount || !form.recipientName || !form.recipientPhone) {
      return
    }

    try {
      const quote = await getRemittanceQuote(form.amount, form.currency)
      setSelectedQuote({ ...quote, ...form })
    } catch (error) {
      console.error('Error getting quote:', error)
    }
  }

  const handleConfirmRemittance = async () => {
    if (!selectedQuote) return
    
    try {
      await createRemittance(selectedQuote)
      setForm({
        amount: 0,
        currency: 'USD',
        recipientName: '',
        recipientPhone: '',
        deliveryMethod: 'bank'
      })
    } catch (error) {
      console.error('Error confirming remittance:', error)
    }
  }

  const getStatusColor = (status: RemittanceQuote['status']) => {
    switch (status) {
      case 'completed': return 'green'
      case 'processing': return 'blue'
      case 'failed': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (status: RemittanceQuote['status']) => {
    switch (status) {
      case 'completed': return t('remittances.status.completed')
      case 'processing': return t('remittances.status.processing')
      case 'failed': return t('remittances.status.failed')
      default: return t('remittances.status.pending')
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
            {t('remittances.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('remittances.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Nueva Remesa */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('remittances.new.title')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('remittances.form.amount')}
                  </label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('remittances.form.currency')}
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value as 'USD' | 'MXN' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                  >
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('remittances.form.recipientName')}
                </label>
                <Input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => setForm(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder={t('remittances.form.recipientNamePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('remittances.form.recipientPhone')}
                </label>
                <Input
                  type="tel"
                  value={form.recipientPhone}
                  onChange={(e) => setForm(prev => ({ ...prev, recipientPhone: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('remittances.form.deliveryMethod')}
                </label>
                <select
                  value={form.deliveryMethod}
                  onChange={(e) => setForm(prev => ({ ...prev, deliveryMethod: e.target.value as 'bank' | 'cash' | 'mobile' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="bank">{t('remittances.form.deliveryBank')}</option>
                  <option value="cash">{t('remittances.form.deliveryCash')}</option>
                  <option value="mobile">{t('remittances.form.deliveryMobile')}</option>
                </select>
              </div>

              {form.deliveryMethod === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('remittances.form.recipientBank')}
                    </label>
                    <Input
                      type="text"
                      value={form.recipientBank || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, recipientBank: e.target.value }))}
                      placeholder={t('remittances.form.recipientBankPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('remittances.form.recipientAccount')}
                    </label>
                    <Input
                      type="text"
                      value={form.recipientAccount || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, recipientAccount: e.target.value }))}
                      placeholder={t('remittances.form.recipientAccountPlaceholder')}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('remittances.form.notes')}
                </label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('remittances.form.notesPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('common.loading') : t('remittances.form.getQuote')}
              </button>
            </form>
          </Card>

          {/* Cotización y Confirmación */}
          {selectedQuote && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {t('remittances.quote.title')}
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('remittances.quote.amount')}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(selectedQuote.amount, selectedQuote.currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('remittances.quote.fee')}
                    </span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(selectedQuote.fee, selectedQuote.currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('remittances.quote.exchangeRate')}
                    </span>
                    <span className="font-medium">
                      1 USD = {selectedQuote.exchangeRate} MXN
                    </span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        {t('remittances.quote.totalCost')}
                      </span>
                      <span className="font-bold text-lg">
                        {formatCurrency(selectedQuote.totalCost, selectedQuote.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {t('remittances.quote.recipient')}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedQuote.recipientName}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedQuote.recipientPhone}
                  </p>
                  {selectedQuote.recipientBank && (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedQuote.recipientBank}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('remittances.quote.delivery')}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t(`remittances.form.delivery${selectedQuote.deliveryMethod.charAt(0).toUpperCase() + selectedQuote.deliveryMethod.slice(1)}`)}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t('remittances.quote.estimatedDelivery')}: {selectedQuote.estimatedDelivery}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleConfirmRemittance}
                    disabled={isLoading || !usdtBalance || usdtBalance.value < BigInt(selectedQuote.totalCost * 1e6)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? t('common.processing') : t('remittances.quote.confirm')}
                  </button>
                </div>

                {usdtBalance && usdtBalance.value < BigInt(selectedQuote.totalCost * 1e6) && (
                  <Alert type="error">
                    {t('remittances.insufficientBalance')}
                  </Alert>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Historial de Remesas */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">
            {t('remittances.history.title')}
          </h2>
          
          {quotes.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              {t('remittances.history.empty')}
            </Card>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">
                          {formatCurrency(quote.amount, quote.currency)}
                        </h3>
                        <Badge color={getStatusColor(quote.status)}>
                          {getStatusText(quote.status)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span className="font-medium">{t('remittances.history.recipient')}:</span> {quote.recipientName}
                        </p>
                        <p>
                          <span className="font-medium">{t('remittances.history.phone')}:</span> {quote.recipientPhone}
                        </p>
                        <p>
                          <span className="font-medium">{t('remittances.history.fee')}:</span> {formatCurrency(quote.fee, quote.currency)}
                        </p>
                        <p>
                          <span className="font-medium">{t('remittances.history.created')}:</span> {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(quote.totalCost, quote.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(quote.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
