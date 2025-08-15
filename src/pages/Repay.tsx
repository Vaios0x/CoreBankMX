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
import { useAccount } from 'wagmi'

const Schema = z.object({
  repayAmount: z.coerce.number().positive(),
  withdrawAmount: z.coerce.number().nonnegative().optional(),
})

type FormValues = z.infer<typeof Schema>

export default function Repay() {
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(Schema), defaultValues: { repayAmount: 0, withdrawAmount: 0 } })
  const { address } = useAccount()
  const { data: price } = useOracle()
  const t = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const repayAmount = watch('repayAmount') || 0
  const withdrawAmount = watch('withdrawAmount') || 0
  const { push } = useToastStore()
  const { repay, withdraw } = useTx() as any
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
        push({ type: 'info', message: t('repay.withdraw_disabled_reason') as string })
        return
      }
      push({ type: 'info', message: t('repay.submitting') as string })
      const hash = await repay(repayAmount)
      track('repay_submitted', { amount: repayAmount })
      push({ type: 'success', message: `${t('repay.tx_sent_base') as string} ${String(hash).slice(0, 10)}…` })
      if (withdrawAmount && withdrawAmount > 0) {
        const wtx = await withdraw(withdrawAmount)
        track('withdraw_submitted', { amount: withdrawAmount })
        push({ type: 'success', message: `${(t('repay.withdraw_sent_base') as string) ?? 'Withdraw sent:'} ${String(wtx).slice(0, 10)}…` })
      }
    } catch (e: any) {
      push({ type: 'error', message: e?.message ?? (t('repay.failed') as string) })
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
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-4 sm:space-y-6 p-4 sm:p-0" aria-label="Repay form">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold">{t('nav.repay') as string}</h1>
        <p className="text-sm text-ui-muted mt-1">{t('repay.subtitle') as string}</p>
      </div>

      {/* Repay Input Section */}
      <div className="space-y-3 sm:space-y-4">
        <Input
          name="repayAmount"
          label={t('repay.repay_label') as string}
          type="number"
          step="any"
          value={repayAmount}
          onChange={(v) => setValue('repayAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
          error={errors.repayAmount ? (t('repay.error_amount') as string) : undefined}
          tooltip={t('repay.repay_tip') as string}
        />
        <div className="px-2 sm:px-0">
          <Slider
            value={repayAmount}
            onChange={(v) => setValue('repayAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
            min={0}
            max={currentDebtUsd}
            step={10}
            label={t('repay.repay_slider_label') as string}
          />
        </div>
      </div>

      {/* Withdraw Input Section */}
      <div className="space-y-3 sm:space-y-4">
        <Input
          name="withdrawAmount"
          label={t('repay.withdraw_label') as string}
          type="number"
          step="any"
          value={withdrawAmount}
          onChange={(v) => setValue('withdrawAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
          tooltip={t('repay.withdraw_tip') as string}
          error={withdrawTooHigh ? (t('repay.withdraw_exceeds_max') as string) : undefined}
          suffix="BTC"
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-400">
          <span className="flex-1">
            {t('repay.max_withdraw_label') as string}: {Math.max(0, maxWithdrawBtc).toFixed(6)} BTC ({formatUSD(maxWithdrawUsd)})
          </span>
          <button
            type="button"
            className="btn-outline px-2 py-1 text-xs motion-press w-full sm:w-auto"
            onClick={() => setValue('withdrawAmount', Math.max(0, maxWithdrawBtc), { shouldValidate: true, shouldDirty: true })}
          >
            {t('repay.use_max') as string}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card-muted p-4 sm:p-5 space-y-3 sm:space-y-4">
        <h3 className="text-sm font-medium text-ui-muted">{t('repay.summary_title') as string}</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div key="collateral" className="flex justify-between">
            <span className="text-ui-muted">{t('repay.after_collateral_usd') as string}:</span>
            <span className="font-medium">{formatUSD(afterCollateralUsd)}</span>
          </div>
          <div key="ltv" className="flex justify-between">
            <span className="text-ui-muted">{t('repay.after_ltv') as string}:</span>
            <span className="font-medium">{(healthAfter.ltv * 100).toFixed(2)}%</span>
          </div>
          <div key="health" className="flex justify-between">
            <span className="text-ui-muted">{t('repay.after_health') as string}:</span>
            <span className={`font-medium ${healthAfter.status === 'danger' ? 'text-red-400' : healthAfter.status === 'warning' ? 'text-yellow-400' : 'text-green-400'}`}>
              {healthAfter.hf.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Health Warnings */}
        {healthAfter.hf < 1.5 && (
          <div className="mt-2">
            <Badge variant={healthAfter.hf < 1.2 ? 'error' : 'warning'} className="text-xs">
              {healthAfter.hf < 1.2 ? (t('repay.after_health_danger') as string) : (t('repay.after_health_warning') as string)}
            </Badge>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 sm:space-y-4">
        {/* Primary Action */}
        <button
          type="submit"
          className="btn-primary motion-press w-full sm:w-auto"
          disabled={withdrawTooHigh}
        >
          {t('repay.repay_button') as string}
        </button>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            key="copy-link"
            type="button"
            className="btn-outline motion-press text-xs sm:text-sm flex-1 sm:flex-none"
            aria-label={t('repay.copy_link') as string}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                push({ type: 'success', message: t('repay.link_copied') as string })
              } catch {}
            }}
          >
            {t('repay.copy_link') as string}
          </button>
          <button
            key="reset-filters"
            type="button"
            className="btn-outline motion-press text-xs sm:text-sm flex-1 sm:flex-none"
            onClick={() => {
              const url = new URL(window.location.href)
              url.searchParams.delete('repay')
              url.searchParams.delete('withdraw')
              window.history.replaceState({}, '', url)
              setValue('repayAmount', 0, { shouldValidate: true })
              setValue('withdrawAmount', 0, { shouldValidate: true })
            }}
          >
            {t('repay.reset_filters') as string}
          </button>
        </div>
      </div>
    </form>
  )
}


