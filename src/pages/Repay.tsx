import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToastStore } from '../components/ui/Toast'
import { useTx } from '../hooks/useTx'
import { zodResolver } from '@hookform/resolvers/zod'
import Slider from '../components/ui/Slider'
import Input from '../components/ui/Input'
import { useI18n } from '../i18n/i18n'
import { useOracle } from '../hooks/useOracle'
import { usePositionsStore } from '../state/usePositionsStore'
import { useMarketStore } from '../state/useMarketStore'
import { useHealth } from '../hooks/useHealth'
import { formatUSD } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { track } from '../lib/telemetry'

const Schema = z.object({
  repayAmount: z.coerce.number().positive(),
  withdrawAmount: z.coerce.number().nonnegative().optional(),
})

type FormValues = z.infer<typeof Schema>

export default function Repay() {
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(Schema), defaultValues: { repayAmount: 0, withdrawAmount: 0 } })
  const t = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const repayAmount = watch('repayAmount') || 0
  const withdrawAmount = watch('withdrawAmount') || 0
  const { push } = useToastStore()
  const { repay, withdraw } = useTx() as any
  const { data: price } = useOracle()
  const { positions } = usePositionsStore()
  const current = positions[0] || { collateralBtc: 0, debtUsdt: 0 }

  const currentCollateralUsd = (current.collateralBtc || 0) * (price ?? 0)
  const currentDebtUsd = current.debtUsdt || 0
  const afterDebtUsd = Math.max(currentDebtUsd - repayAmount, 0)
  const { liquidationLtv } = useMarketStore()
  const safety = 0.9
  const denom = Math.max((liquidationLtv || 0.8) * safety, 0.000001)
  const minCollateralUsdNeeded = afterDebtUsd / denom
  const maxWithdrawUsd = Math.max(0, currentCollateralUsd - minCollateralUsdNeeded)
  const maxWithdrawBtc = (price ?? 0) > 0 ? maxWithdrawUsd / (price ?? 1) : 0

  const afterCollateralUsd = Math.max(currentCollateralUsd - (withdrawAmount * (price ?? 0)), 0)
  const healthAfter = useHealth(afterCollateralUsd, afterDebtUsd)
  const withdrawTooHigh = withdrawAmount > maxWithdrawBtc + 1e-12
  const onSubmit = async (_data: FormValues) => {
    try {
      if (withdrawTooHigh) {
        push({ type: 'info', message: t('repay.withdraw_disabled_reason') })
        return
      }
      push({ type: 'info', message: t('repay.submitting') })
      const hash = await repay(repayAmount)
      track('repay_submitted', { amount: repayAmount })
      push({ type: 'success', message: `${t('repay.tx_sent_base')} ${String(hash).slice(0, 10)}…` })
      if (withdrawAmount && withdrawAmount > 0) {
        const wtx = await withdraw(withdrawAmount)
        track('withdraw_submitted', { amount: withdrawAmount })
        push({ type: 'success', message: `${t('repay.withdraw_sent_base') ?? 'Withdraw sent:'} ${String(wtx).slice(0, 10)}…` })
      }
    } catch (e: any) {
      push({ type: 'error', message: e?.message ?? t('repay.failed') })
    }
  }
  // Prefill from URL query once on mount
  useEffect(() => {
    const repay = parseFloat(searchParams.get('repay') || '')
    const withdraw = parseFloat(searchParams.get('withdraw') || '')
    if (Number.isFinite(repay) && repay >= 0) setValue('repayAmount', repay, { shouldValidate: true })
    if (Number.isFinite(withdraw) && withdraw >= 0) setValue('withdrawAmount', withdraw, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirror form values into URL for deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (repayAmount > 0) params.set('repay', String(repayAmount))
    else params.delete('repay')
    if (withdrawAmount > 0) params.set('withdraw', String(withdrawAmount))
    else params.delete('withdraw')
    setSearchParams(params, { replace: true })
  }, [repayAmount, withdrawAmount, setSearchParams])
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-4" aria-label="Repay form">
      <h1 className="text-xl font-semibold">{t('nav.repay')}</h1>
      <div>
        <Input
          name="repayAmount"
          label={t('repay.repay_label')}
          type="number"
          step="any"
          value={repayAmount}
          onChange={(v) => setValue('repayAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
          error={errors.repayAmount ? t('repay.error_amount') : undefined}
          tooltip={t('repay.repay_tip')}
        />
        <div className="mt-3">
          <Slider
            value={repayAmount}
            onChange={(v) => setValue('repayAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
            min={0}
            max={currentDebtUsd}
            step={10}
            label={t('repay.repay_slider_label')}
          />
        </div>
      </div>
      <div>
        <Input
          name="withdrawAmount"
          label={t('repay.withdraw_label')}
          type="number"
          step="any"
          value={withdrawAmount}
          onChange={(v) => setValue('withdrawAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
          tooltip={t('repay.withdraw_tip')}
          error={withdrawTooHigh ? t('repay.withdraw_exceeds_max') : undefined}
          suffix="BTC"
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span>
            {t('repay.max_withdraw_label')}: {Math.max(0, maxWithdrawBtc).toFixed(6)} BTC ({formatUSD(maxWithdrawUsd)})
          </span>
          <button
            type="button"
            className="btn-outline px-2 py-0.5 text-xs motion-press"
            onClick={() => setValue('withdrawAmount', Math.max(0, maxWithdrawBtc), { shouldValidate: true, shouldDirty: true })}
          >
            {t('repay.use_max')}
          </button>
        </div>
      </div>
      <div className="card-muted text-sm text-gray-300">
        <div>{t('repay.after_collateral_usd')}: {formatUSD(afterCollateralUsd)}</div>
        <div>{t('repay.after_ltv')}: {(healthAfter.ltv * 100).toFixed(2)}%</div>
        <div>
          {t('repay.after_health')}: <span className={healthAfter.status === 'danger' ? 'text-red-400' : healthAfter.status === 'warning' ? 'text-yellow-400' : 'text-green-400'}>{healthAfter.hf.toFixed(2)}</span>
        </div>
        {healthAfter.hf < 1.5 && (
          <p className={`mt-2 text-xs ${healthAfter.hf < 1.2 ? 'text-red-400' : 'text-yellow-400'}`}>
            <Badge variant={healthAfter.hf < 1.2 ? 'error' : 'warning'}>
              {healthAfter.hf < 1.2 ? t('repay.after_health_danger') : t('repay.after_health_warning')}
            </Badge>
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-outline motion-press"
          aria-label={t('repay.copy_link')}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              push({ type: 'success', message: t('repay.link_copied') })
            } catch {}
          }}
        >
          {t('repay.copy_link')}
        </button>
        <button
          type="button"
          className="btn-outline motion-press"
          onClick={() => {
            const url = new URL(window.location.href)
            url.searchParams.delete('repay')
            url.searchParams.delete('withdraw')
            window.history.replaceState({}, '', url)
            setValue('repayAmount', 0, { shouldValidate: true })
            setValue('withdrawAmount', 0, { shouldValidate: true })
          }}
        >
          {t('repay.reset_filters')}
        </button>
        <button
          type="submit"
          className="btn-primary motion-press"
          disabled={withdrawTooHigh}
        >
          {t('repay.repay_button')}
        </button>
      </div>
    </form>
  )
}


