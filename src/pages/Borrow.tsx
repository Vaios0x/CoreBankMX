import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useOracle } from '../hooks/useOracle'
import { useHealth } from '../hooks/useHealth'
import { formatUSD } from '../lib/format'
import { useToastStore } from '../components/ui/Toast'
import HealthBar from '../components/market/HealthBar'
import { useTx } from '../hooks/useTx'
import Slider from '../components/ui/Slider'
import Input from '../components/ui/Input'
import { useMarketStore } from '../state/useMarketStore'
import { useI18n } from '../i18n/i18n'
import { Alert } from '../components/ui/Alert'
import { useAccount } from 'wagmi'
import { useFeeEstimate } from '../hooks/useFee'
import { track } from '../lib/telemetry'

const Schema = z.object({
  collateralAmount: z.coerce.number().positive(),
  borrowAmount: z.coerce.number().positive(),
})

type FormValues = z.infer<typeof Schema>

export default function Borrow() {
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(Schema), defaultValues: { collateralAmount: 0, borrowAmount: 0 } })
  const { data: price } = useOracle()
  const t = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()

  const collateral = watch('collateralAmount') || 0
  const borrow = watch('borrowAmount') || 0
  const collateralUsd = collateral * (price ?? 0)
  const health = useHealth(collateralUsd, borrow)
  const { targetLtv, originationFeeBps, minBorrowAmount } = useMarketStore()
  const { address } = useAccount()
  const feeEst = useFeeEstimate(borrow, address as `0x${string}` | undefined)
  const maxBorrowAtTarget = collateralUsd * (targetLtv || 0.6)

  const { push } = useToastStore()
  const { approveCollateral, borrow: borrowTx, deposit } = useTx()
  const feeUsd = useMemo(() => (typeof feeEst.data?.fee === 'number' ? feeEst.data.fee : (originationFeeBps ? (borrow * (originationFeeBps / 10_000)) : 0)), [borrow, originationFeeBps, feeEst.data])
  const belowMin = useMemo(() => (minBorrowAmount ? borrow < minBorrowAmount : (typeof feeEst.data?.minBorrow === 'number' ? borrow < feeEst.data.minBorrow : false)), [borrow, minBorrowAmount, feeEst.data])
  const onSubmit = async (_data: FormValues) => {
    try {
      // flujo real: approve -> deposit -> borrow
      push({ type: 'info', message: t('borrow.toast_approving') })
      await approveCollateral()
      track('approve_collateral', { amount: collateral })
      push({ type: 'success', message: t('borrow.toast_approve_done') })
      if (collateral > 0) {
        push({ type: 'info', message: t('borrow.toast_depositing') })
        await deposit(collateral)
        track('deposit_collateral', { amount: collateral })
        push({ type: 'success', message: t('borrow.toast_deposit_sent') })
      }
      push({ type: 'info', message: t('borrow.toast_borrowing') })
      const hash = await borrowTx(borrow)
      track('borrow_submitted', { amount: borrow, feeUsd })
      push({ type: 'success', message: `${t('borrow.toast_borrow_sent_base')} ${String(hash).slice(0, 10)}…` })
    } catch (e: any) {
      track('borrow_failed', { message: e?.message })
      push({ type: 'error', message: e?.message ?? t('borrow.toast_borrow_failed') })
    }
  }

  const isBorrowDisabled = health.hf < 1.2 || belowMin

  // Prefill from URL query once on mount
  useEffect(() => {
    const col = parseFloat(searchParams.get('collateral') || '')
    const bor = parseFloat(searchParams.get('borrow') || '')
    if (Number.isFinite(col) && col >= 0) setValue('collateralAmount', col, { shouldValidate: true })
    if (Number.isFinite(bor) && bor >= 0) setValue('borrowAmount', bor, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirror form values into URL for deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (collateral > 0) params.set('collateral', String(collateral))
    else params.delete('collateral')
    if (borrow > 0) params.set('borrow', String(borrow))
    else params.delete('borrow')
    setSearchParams(params, { replace: true })
  }, [collateral, borrow, setSearchParams])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-4" aria-label="Borrow form">
      <h1 className="text-xl font-semibold">{t('nav.borrow')}</h1>
      <div>
        <Input
          name="collateralAmount"
          label={t('borrow.collateral_label')}
          type="number"
          step="any"
          value={collateral}
          onChange={(v) => setValue('collateralAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
          error={errors.collateralAmount ? t('borrow.error_amount') : undefined}
          tooltip={t('borrow.collateral_tip')}
        />
      </div>
      <div>
        <Input
          name="borrowAmount"
          label={t('borrow.borrow_label')}
          type="number"
          step="any"
          value={borrow}
          onChange={(v) => setValue('borrowAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
          error={errors.borrowAmount ? t('borrow.error_amount') : undefined}
          tooltip={t('borrow.borrow_tip')}
        />
        <div className="mt-3">
          <Slider
            value={borrow || 0}
            onChange={(v) => setValue('borrowAmount', Number(v || 0), { shouldValidate: true, shouldDirty: true })}
            min={0}
            max={maxBorrowAtTarget || 0}
            step={Math.max(1, Math.round((maxBorrowAtTarget || 0) / 100))}
            label={`${t('borrow.suggested_ltv_prefix')} ${(targetLtv * 100).toFixed(0)}%)`}
            marks={[0, maxBorrowAtTarget * 0.25, maxBorrowAtTarget * 0.5, maxBorrowAtTarget * 0.75, maxBorrowAtTarget]}
            format={(v) => formatUSD(Number.isFinite(v) ? v : 0)}
          />
        </div>
      </div>
      <div className="card-muted text-sm text-gray-300">
        <div>{t('borrow.collateral_usd')}: {formatUSD(collateralUsd || 0)}</div>
        <div>{t('borrow.ltv_label')}: {(health.ltv * 100).toFixed(2)}%</div>
        <div>
          {t('borrow.health_label')}: <span className={health.status === 'danger' ? 'text-red-400' : health.status === 'warning' ? 'text-yellow-400' : 'text-green-400'}>{health.hf.toFixed(2)}</span>
        </div>
        <div className="mt-2"><HealthBar value={Math.min(2, health.hf) / 2} /></div>
        <div className="mt-2 text-xs text-gray-400">{t('borrow.liquidation_ltv')}: {((useMarketStore.getState().liquidationLtv || 0.8) * 100).toFixed(0)}%</div>
        <div className="mt-1 text-xs text-gray-400">
          Fee: {feeEst.data?.bps ?? originationFeeBps ?? 0} bps (~{formatUSD(feeUsd)}) {feeEst.data?.pro ? <span className="ml-1 rounded bg-green-900/40 px-1 py-0.5 text-green-300">Pro</span> : null}
        </div>
        {belowMin && (
          <Alert variant="warning" className="mt-2 text-xs">Min borrow: {formatUSD(minBorrowAmount || 0)}</Alert>
        )}
        {health.hf < 1.5 && (
          <Alert variant={health.hf < 1.2 ? 'danger' : 'warning'} className="mt-2 text-xs">
            {health.hf < 1.2 ? t('borrow.error_ltv') : t('borrow.warning_hf')}
          </Alert>
        )}
        <div className="mt-2 text-xs">
          <Link to="/#ltv" className="text-brand-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500">
            {t('borrow.learn_ltv')}
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-outline motion-press"
          aria-label={t('borrow.copy_link')}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              push({ type: 'success', message: t('borrow.link_copied') })
            } catch {}
          }}
        >
          {t('borrow.copy_link')}
        </button>
        <button
          type="button"
          className="btn-outline motion-press"
          onClick={() => {
            const url = new URL(window.location.href)
            url.searchParams.delete('collateral')
            url.searchParams.delete('borrow')
            window.history.replaceState({}, '', url)
            setValue('collateralAmount', 0, { shouldValidate: true })
            setValue('borrowAmount', 0, { shouldValidate: true })
          }}
        >
          {t('borrow.reset_filters')}
        </button>
        <button
          type="button"
          className="btn-outline motion-press"
          onClick={async () => {
            try {
              push({ type: 'info', message: t('borrow.toast_approving') })
              const hash = await approveCollateral()
              track('approve_collateral', { from: 'borrow_page' })
              push({ type: 'success', message: `${t('borrow.toast_approve_sent_base')} ${String(hash).slice(0, 10)}…` })
            } catch (e: any) {
              push({ type: 'error', message: e?.message ?? t('borrow.toast_approve_failed') })
            }
          }}
        >
          {t('borrow.approve_button')}
        </button>
        <button
          type="submit"
          className="btn-primary motion-press"
          disabled={isBorrowDisabled}
          onClick={async (e) => {
            e.preventDefault()
            try {
              if (isBorrowDisabled) {
                push({ type: 'info', message: t('borrow.disabled_reason') })
                return
              }
              push({ type: 'info', message: t('borrow.toast_borrowing') })
              const hash = await borrowTx(borrow)
              push({ type: 'success', message: `${t('borrow.toast_borrow_sent_base')} ${String(hash).slice(0, 10)}…` })
            } catch (e: any) {
              push({ type: 'error', message: e?.message ?? t('borrow.toast_borrow_failed') })
            }
          }}
        >
          {t('borrow.borrow_button')}
        </button>
        {isBorrowDisabled && (
          <button
            type="button"
            className="text-xs text-gray-400 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500"
            onClick={() => push({ type: 'info', message: t('borrow.disabled_reason') })}
          >
            {t('borrow.why_disabled')}
          </button>
        )}
      </div>
    </form>
  )
}


