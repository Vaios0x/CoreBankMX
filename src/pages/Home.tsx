import { motion } from 'framer-motion'
import { useMarketStore } from '../state/useMarketStore'
import { useOracle } from '../hooks/useOracle'
import { formatUSD } from '../lib/format'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '../components/web3/ConnectButton'
import { useI18n } from '../i18n/i18n'

export default function Home() {
  const { tvlUsd, baseRate } = useMarketStore()
  const { data: btcPrice } = useOracle()
  const { isConnected } = useAccount()
  const t = useI18n()

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden card rounded-2xl p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:max-w-3xl">
          <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="inline-flex w-fit items-center gap-2 rounded-full border border-ui bg-ui-surface px-3 py-1 text-xs text-ui-muted">
            {t('home.badge')}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('home.title')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-ui-muted">
            {t('home.subtitle')}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-wrap gap-3">
            {isConnected ? (
              <>
                <Link to="/borrow" className="btn-primary text-sm motion-press">{t('home.start_button')}</Link>
                <Link to="/dashboard" className="btn-outline text-sm motion-press">{t('home.dashboard_button')}</Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <ConnectButton />
                <span className="text-xs text-ui-muted">{t('home.connect_hint')}</span>
              </div>
            )}
          </motion.div>
        </div>
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="absolute right-10 top-24 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[{ label: 'TVL', value: formatUSD(tvlUsd) }, { label: 'Base Rate', value: `${(baseRate * 100).toFixed(2)}%` }, { label: 'BTC/USD', value: btcPrice ? formatUSD(btcPrice) : '—' }].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2 }} className="kpi-card">
            <div className="text-xs uppercase tracking-wide text-ui-muted">{kpi.label}</div>
            <div className="mt-1 text-2xl font-medium">{kpi.value}</div>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { t: t('home.features.remittances') as string, d: t('home.features.remittances_desc') as string },
          { t: t('home.features.loans') as string, d: t('home.features.loans_desc') as string },
          { t: t('home.features.staking') as string, d: t('home.features.staking_desc') as string },
          { t: t('home.features.oracles') as string, d: t('home.features.oracles_desc') as string },
          { t: t('home.features.compliance') as string, d: t('home.features.compliance_desc') as string },
          { t: t('home.features.gas_rebates') as string, d: t('home.features.gas_rebates_desc') as string },
        ].map((f) => (
          <motion.div key={f.t as string} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2 }} className="card p-5">
            <h3 className="text-sm font-medium">{f.t}</h3>
            <p className="mt-1 text-sm text-ui-muted">{f.d}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { n: '1', t: t('home.steps.step1') as string, d: t('home.steps.step1_desc') as string },
          { n: '2', t: t('home.steps.step2') as string, d: t('home.steps.step2_desc') as string },
          { n: '3', t: t('home.steps.step3') as string, d: t('home.steps.step3_desc') as string },
          { n: '4', t: t('home.steps.step4') as string, d: t('home.steps.step4_desc') as string },
        ].map((s) => (
          <motion.div key={s.n} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2 }} className="card p-5">
            <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/20 text-sm text-brand-200">{s.n}</div>
            <h4 className="text-sm font-medium">{s.t}</h4>
            <p className="mt-1 text-sm text-ui-muted">{s.d}</p>
          </motion.div>
        ))}
      </section>

      <section className="card p-5 text-sm text-ui-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            {t('home.note') as string}
          </p>
          <div className="flex items-center gap-2">
            <span className="badge-warning">{t('home.beta') as string}</span>
            <Link to="/dashboard" className="btn-outline btn-sm motion-press">{t('home.view_metrics') as string}</Link>
          </div>
        </div>
      </section>

      <section id="ltv" className="card p-5 prose prose-invert max-w-none">
        <h2 className="text-lg font-semibold">{t('home.ltv_title') as string}</h2>
        <p>
          {t('home.ltv_desc') as string}
        </p>
        <ul className="mt-3 space-y-1">
          {(t('home.ltv_points') as string[]).map((point: string, index: number) => (
            <li key={index}>
              {point}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}


