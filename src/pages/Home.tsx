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
    <div className="space-y-6 sm:space-y-8 lg:space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 lg:max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }} 
            className="flex items-center gap-3"
          >
            <img src="/src/assets/Logo2.svg" alt="Banobs Logo" className="h-16 w-16 sm:h-20 sm:w-20" />
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ui bg-ui-surface px-2 py-1 sm:px-3 sm:py-1 text-xs text-ui-muted">
              {t('home.badge')}
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.25 }} 
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight"
          >
            {t('home.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }} 
            className="text-sm sm:text-base text-ui-muted leading-relaxed"
          >
            {t('home.subtitle')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.35 }} 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            {isConnected ? (
              <>
                <Link to="/borrow" className="btn-primary text-sm motion-press w-full sm:w-auto text-center">
                  {t('home.start_button')}
                </Link>
                <Link to="/dashboard" className="btn-outline text-sm motion-press w-full sm:w-auto text-center">
                  {t('home.dashboard_button')}
                </Link>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <ConnectButton />
                <span className="text-xs text-ui-muted text-center sm:text-left">
                  {t('home.connect_hint')}
                </span>
              </div>
            )}
          </motion.div>
        </div>
        {/* Background decoration - hidden on mobile for better performance */}
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20 hidden sm:block">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="absolute right-10 top-24 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'TVL', value: formatUSD(tvlUsd) }, 
          { label: 'Base Rate', value: `${(baseRate * 100).toFixed(2)}%` }, 
          { label: 'BTC/USD', value: btcPrice ? formatUSD(btcPrice) : '—' }
        ].map((kpi) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 8 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.2 }} 
            className="kpi-card p-3 sm:p-4"
          >
            <div className="text-xs uppercase tracking-wide text-ui-muted">{kpi.label}</div>
            <div className="mt-1 text-xl sm:text-2xl font-medium break-words">{kpi.value}</div>
          </motion.div>
        ))}
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          { t: t('home.features.remittances') as string, d: t('home.features.remittances_desc') as string },
          { t: t('home.features.loans') as string, d: t('home.features.loans_desc') as string },
          { t: t('home.features.staking') as string, d: t('home.features.staking_desc') as string },
          { t: t('home.features.oracles') as string, d: t('home.features.oracles_desc') as string },
          { t: t('home.features.compliance') as string, d: t('home.features.compliance_desc') as string },
          { t: t('home.features.gas_rebates') as string, d: t('home.features.gas_rebates_desc') as string },
        ].map((f) => (
          <motion.div 
            key={f.t as string} 
            initial={{ opacity: 0, y: 8 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.2 }} 
            className="card p-3 sm:p-4 lg:p-5"
          >
            <h3 className="text-sm font-medium mb-2">{f.t}</h3>
            <p className="text-xs sm:text-sm text-ui-muted leading-relaxed">{f.d}</p>
          </motion.div>
        ))}
      </section>

      {/* Steps Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { n: '1', t: t('home.steps.step1') as string, d: t('home.steps.step1_desc') as string },
          { n: '2', t: t('home.steps.step2') as string, d: t('home.steps.step2_desc') as string },
          { n: '3', t: t('home.steps.step3') as string, d: t('home.steps.step3_desc') as string },
          { n: '4', t: t('home.steps.step4') as string, d: t('home.steps.step4_desc') as string },
        ].map((s) => (
          <motion.div 
            key={s.n} 
            initial={{ opacity: 0, y: 8 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.2 }} 
            className="card p-3 sm:p-4 lg:p-5"
          >
            <div className="mb-2 inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-brand-600/20 text-xs sm:text-sm text-brand-200">
              {s.n}
            </div>
            <h4 className="text-sm font-medium mb-2">{s.t}</h4>
            <p className="text-xs sm:text-sm text-ui-muted leading-relaxed">{s.d}</p>
          </motion.div>
        ))}
      </section>

      {/* Note Section */}
      <section className="card p-3 sm:p-4 lg:p-5 text-xs sm:text-sm text-ui-muted">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="leading-relaxed">
            {t('home.note') as string}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <span className="badge-warning text-xs">{t('home.beta') as string}</span>
            <Link to="/dashboard" className="btn-outline btn-sm motion-press w-full sm:w-auto text-center">
              {t('home.view_metrics') as string}
            </Link>
          </div>
        </div>
      </section>

      {/* LTV Section */}
      <section id="ltv" className="card p-3 sm:p-4 lg:p-5 prose prose-invert max-w-none">
        <h2 className="text-base sm:text-lg font-semibold mb-3">{t('home.ltv_title') as string}</h2>
        <p className="text-xs sm:text-sm leading-relaxed mb-3">
          {t('home.ltv_desc') as string}
        </p>
        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
          {(t('home.ltv_points') as string[]).map((point: string, index: number) => (
            <li key={index} className="leading-relaxed">
              {point}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}


