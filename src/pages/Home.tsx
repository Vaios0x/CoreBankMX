import { motion } from 'framer-motion'
import { useMarketStore } from '../state/useMarketStore'
import { useOracle } from '../hooks/useOracle'
import { formatUSD } from '../lib/format'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '../components/web3/ConnectButton'

export default function Home() {
  const { tvlUsd, baseRate } = useMarketStore()
  const { data: btcPrice } = useOracle()
  const { isConnected } = useAccount()

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden card rounded-2xl p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:max-w-3xl">
          <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="inline-flex w-fit items-center gap-2 rounded-full border border-ui bg-ui-surface px-3 py-1 text-xs text-ui-muted">
            Build on Core DAO • BTCfi • DeFi • Web3
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Neobanco Web3 en Core: remesas y préstamos con BTC como colateral
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-ui-muted">
            Bloquea BTC puenteado en un vault no-custodial y recibe USDT. LTV dinámico con oráculos (Pyth/RedStone), auto-liquidaciones seguras, y opción de Dual Staking para componer rendimientos.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-wrap gap-3">
            {isConnected ? (
              <>
                <Link to="/borrow" className="btn-primary text-sm motion-press">Comenzar</Link>
                <Link to="/dashboard" className="btn-outline text-sm motion-press">Ver Dashboard</Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <ConnectButton />
                <span className="text-xs text-ui-muted">Conecta tu wallet para empezar</span>
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
          { t: 'Remesas + Off-ramp MXN', d: 'Envíos rápidos y on/off-ramp vía integraciones (p. ej., Bitso) fuera del contrato.' },
          { t: 'Préstamos con BTC', d: 'Bloquea BTC/lstBTC como colateral para recibir USDT con LTV dinámico.' },
          { t: 'Dual Staking', d: 'Opción para depositantes: componer rendimientos y mejorar APR.' },
          { t: 'Oráculos y Circuit Breakers', d: 'Pyth/RedStone, staleness y desviación controladas para seguridad.' },
          { t: 'Cumplimiento', d: 'KYC/KYB en app cuando hay fiat, geofencing y travel rule.' },
          { t: 'Gas Rebates', d: 'Aprovecha incentivos de Core para reducir costos de transacción.' },
        ].map((f) => (
          <motion.div key={f.t} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2 }} className="card p-5">
            <h3 className="text-sm font-medium">{f.t}</h3>
            <p className="mt-1 text-sm text-ui-muted">{f.d}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { n: '1', t: 'Conecta tu wallet', d: 'Compatible con Web3Modal/Wagmi.' },
          { n: '2', t: 'Bloquea BTC', d: 'Usa bridge y deposita colateral en el vault.' },
          { n: '3', t: 'Toma tu préstamo', d: 'Recibe USDT y gestiona tu LTV.' },
          { n: '4', t: 'Compón y paga', d: 'Dual Staking opcional; repaga cuando quieras.' },
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
            Nota: este producto funciona en Core (Mainnet/Testnet). Las integraciones fiat (KYC/KYB y on/off-ramp) ocurren en la capa de app y no forman parte del contrato.
          </p>
          <div className="flex items-center gap-2">
            <span className="badge-warning">Beta</span>
            <Link to="/dashboard" className="btn-outline btn-sm motion-press">Ver métricas</Link>
          </div>
        </div>
      </section>

      <section id="ltv" className="card p-5 prose prose-invert max-w-none">
        <h2 className="text-lg font-semibold">¿Cómo calculamos el LTV y el Health Factor?</h2>
        <p>
          El LTV (Loan-to-Value) indica qué porcentaje del valor de tu colateral está prestado.
        </p>
        <ul className="mt-3 space-y-1">
          <li>
            LTV = deuda / valor del colateral en USD. El valor del colateral se obtiene con oráculos (Pyth/RedStone) con
            protecciones de staleness y desviación.
          </li>
          <li>
            Hay un LTV de liquidación configurado en el mercado. Si tu LTV lo supera, tu posición puede liquidarse
            parcialmente para volver a un nivel seguro.
          </li>
          <li>
            Health Factor (HF) agrega un margen de seguridad sobre el LTV. Si HF {'<'} 1, la cuenta es liquidable. Recomendamos
            mantener HF ≥ 1.5 para condiciones normales de mercado.
          </li>
          <li>
            Para mejorar tu HF: aporta más colateral o reduce tu deuda (repaga). En el flujo de “Borrow” verás alertas y el
            botón se deshabilita si HF {'<'} 1.2.
          </li>
        </ul>
      </section>
    </div>
  )
}


