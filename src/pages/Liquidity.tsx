import { useToastStore } from '../components/ui/Toast'
import { useStaking } from '../hooks/useStaking'
import Input from '../components/ui/Input'
import { useState, useEffect } from 'react'
import { useI18n } from '../i18n/i18n'
import { motion } from 'framer-motion'
import { formatUSD } from '../lib/format'
import { Sparkline } from '../components/ui/Sparkline'

export default function Liquidity() {
  const { push } = useToastStore()
  const { approveStake, stake, unstake } = useStaking()
  const [amount, setAmount] = useState(0)
  const t = useI18n()
  
  // Datos de demostración
  const [stakedAmount, setStakedAmount] = useState(1250)
  const [totalStaked, setTotalStaked] = useState(2850000)
  const [apr, setApr] = useState(12.5)
  const [rewards, setRewards] = useState(156.25)
  const [stakedHistory, setStakedHistory] = useState<number[]>([])
  const [apiAvailable, setApiAvailable] = useState(true)
  
  // Simular datos de staking
  useEffect(() => {
    const seed = totalStaked
    const series = Array.from({ length: 24 }).map((_, i) => seed * (1 + Math.sin(i / 4) * 0.02))
    setStakedHistory(series)
  }, [totalStaked])

  // Simular actualización de rewards
  useEffect(() => {
    const interval = setInterval(() => {
      setRewards(prev => prev + (stakedAmount * apr / 100 / 365 / 24 / 60)) // Incremento por minuto
    }, 60000)
    return () => clearInterval(interval)
  }, [stakedAmount, apr])
  
  const onCompound = () => {
    const days = 30
    const future = stakedAmount * Math.pow(1 + apr / 100 / 365, days)
    const profit = future - stakedAmount
    push({ type: 'info', message: `APR ${apr}% — 30d compound preview: ~$${profit.toFixed(2)} profit` })
  }

  const onStake = async () => {
    try {
      const h = await stake(amount)
      push({ type: 'success', message: `Stake sent ${String(h).slice(0, 10)}…` })
      // Simular actualización de datos
      setStakedAmount(prev => prev + amount)
      setTotalStaked(prev => prev + amount)
    } catch (e: any) {
      push({ type: 'error', message: e?.message || 'Stake failed' })
    }
  }

  const onUnstake = async () => {
    try {
      const h = await unstake(amount)
      push({ type: 'success', message: `Unstake sent ${String(h).slice(0, 10)}…` })
      // Simular actualización de datos
      setStakedAmount(prev => Math.max(0, prev - amount))
      setTotalStaked(prev => Math.max(0, prev - amount))
    } catch (e: any) {
      push({ type: 'error', message: e?.message || 'Unstake failed' })
    }
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold">{t('nav.liquidity')}</h1>
        <p className="text-sm text-ui-muted mt-1">{t('liquidity.subtitle') as string}</p>
      </div>

      {/* API Status Banner */}
      {!apiAvailable && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-yellow-500/20 bg-yellow-500/5 p-3 text-center"
        >
          <p className="text-sm text-yellow-400">
            🔧 API no disponible - Mostrando datos de demostración
          </p>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💰</span>
            <span className="text-xs text-ui-muted uppercase tracking-wider">Your Staked</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold">{formatUSD(stakedAmount)}</p>
          <p className="text-xs text-ui-muted">Personal stake</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <span className="text-xs text-ui-muted uppercase tracking-wider">Total Staked</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold">{formatUSD(totalStaked)}</p>
          <p className="text-xs text-ui-muted">Protocol TVL</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📈</span>
            <span className="text-xs text-ui-muted uppercase tracking-wider">APR</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-green-400">{apr}%</p>
          <p className="text-xs text-ui-muted">Annual return</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎁</span>
            <span className="text-xs text-ui-muted uppercase tracking-wider">Rewards</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-brand-400">{formatUSD(rewards)}</p>
          <p className="text-xs text-ui-muted">Accumulated</p>
        </motion.div>
      </div>

      {/* TVL Chart */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="card p-3 sm:p-4 lg:p-5"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Total Value Locked (24h)</h2>
        <div className="h-32 sm:h-40">
          <Sparkline values={stakedHistory} width={800} height={160} />
        </div>
      </motion.section>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-4 sm:p-5 space-y-4 sm:space-y-5"
      >
        <div className="text-center sm:text-left">
          <p className="text-sm text-gray-300">{t('liquidity.description') as string}</p>
        </div>

        {/* Amount Input */}
        <div className="space-y-3 sm:space-y-4">
          <div className="w-full sm:w-48">
            <Input 
              name="stake_amount" 
              label={t('liquidity.amount_label') as string} 
              type="number" 
              step="any" 
              value={amount} 
              onChange={(v) => setAmount(Number(v || 0))} 
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 sm:space-y-4">
          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              className="btn-outline text-xs sm:text-sm flex-1 sm:flex-none motion-press" 
              onClick={async () => { 
                try { 
                  const h = await approveStake(amount); 
                  push({ type: 'success', message: `Approve sent ${String(h).slice(0,10)}…` }) 
                } catch (e: any) { 
                  push({ type: 'error', message: e?.message || 'Approve failed' }) 
                } 
              }}
            >
              {t('liquidity.approve')}
            </button>
            <button 
              className="btn-outline text-xs sm:text-sm flex-1 sm:flex-none motion-press" 
              onClick={onStake}
              disabled={amount <= 0}
            >
              {t('liquidity.stake')}
            </button>
            <button 
              className="btn-outline text-xs sm:text-sm flex-1 sm:flex-none motion-press" 
              onClick={onUnstake}
              disabled={amount <= 0 || amount > stakedAmount}
            >
              {t('liquidity.unstake')}
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={onCompound} 
              className="btn-primary text-xs sm:text-sm flex-1 sm:flex-none motion-press"
            >
              {t('liquidity.compound_preview')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Info Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="card p-4 sm:p-5 space-y-3 sm:space-y-4"
      >
        <h3 className="text-sm font-medium">{t('liquidity.info_title') as string}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-300">
          <div className="space-y-1">
            <p className="font-medium">🔄 {t('liquidity.info_erc4626') as string}</p>
            <p className="text-xs text-gray-400">Standard vault for maximum compatibility</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">📈 {t('liquidity.info_apr') as string}</p>
            <p className="text-xs text-gray-400">Competitive APR with automatic compounding</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">🤖 {t('liquidity.info_compound') as string}</p>
            <p className="text-xs text-gray-400">Compound rewards automatically via Keeper service</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


