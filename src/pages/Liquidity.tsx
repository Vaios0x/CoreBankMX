import { useToastStore } from '../components/ui/Toast'
import { useStaking } from '../hooks/useStaking'
import Input from '../components/ui/Input'
import { useState } from 'react'
import { useI18n } from '../i18n/i18n'

export default function Liquidity() {
  const { push } = useToastStore()
  const { approveStake, stake, unstake } = useStaking()
  const [amount, setAmount] = useState(0)
  const t = useI18n()
  
  const onCompound = () => {
    const apr = 0.12
    const days = 30
    const principal = 1000
    const future = principal * Math.pow(1 + apr / 365, days)
    push({ type: 'info', message: `APR 12% — 30d compound preview: ~$${future.toFixed(2)}` })
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold">{t('nav.liquidity')}</h1>
        <p className="text-sm text-ui-muted mt-1">{t('liquidity.subtitle') as string}</p>
      </div>

      {/* Main Card */}
      <div className="card p-4 sm:p-5 space-y-4 sm:space-y-5">
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
              onClick={async () => { 
                try { 
                  const h = await stake(amount); 
                  push({ type: 'success', message: `Stake sent ${String(h).slice(0,10)}…` }) 
                } catch (e: any) { 
                  push({ type: 'error', message: e?.message || 'Stake failed' }) 
                } 
              }}
            >
              {t('liquidity.stake')}
            </button>
            <button 
              className="btn-outline text-xs sm:text-sm flex-1 sm:flex-none motion-press" 
              onClick={async () => { 
                try { 
                  const h = await unstake(amount); 
                  push({ type: 'success', message: `Unstake sent ${String(h).slice(0,10)}…` }) 
                } catch (e: any) { 
                  push({ type: 'error', message: e?.message || 'Unstake failed' }) 
                } 
              }}
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

        {/* Info Section */}
        <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-md bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-medium mb-2">{t('liquidity.info_title') as string}</h3>
          <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
            <li>• {t('liquidity.info_erc4626') as string}</li>
            <li>• {t('liquidity.info_apr') as string}</li>
            <li>• {t('liquidity.info_compound') as string}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


