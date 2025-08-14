import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/i18n'

export default function Docs() {
  const t = useI18n()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('docs.title') as string}</h1>
        <p className="mt-1 text-ui-muted">{t('docs.subtitle') as string}</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/docs/protocol" className="card p-5 hover:bg-ui-surface/50 motion-press">
          <h3 className="text-sm font-medium">{t('docs.protocol.title') as string}</h3>
          <p className="mt-1 text-sm text-ui-muted">{t('docs.protocol.subtitle') as string}</p>
        </Link>
        <Link to="/docs/api" className="card p-5 hover:bg-ui-surface/50 motion-press">
          <h3 className="text-sm font-medium">{t('docs.api.title') as string}</h3>
          <p className="mt-1 text-sm text-ui-muted">{t('docs.api.subtitle') as string}</p>
        </Link>
      </section>

      <section className="card p-5 prose prose-invert max-w-none">
        <h2 className="text-lg font-semibold">Guía rápida</h2>
        <p className="mt-1 text-sm text-ui-muted">Cómo solicitar préstamo con BTC como colateral y entender LTV/HF.</p>
        <ol className="mt-3 space-y-2 text-sm">
          <li>
            <strong>Conecta wallet</strong>: Usa Web3Modal para conectar tu wallet (MetaMask, WalletConnect, etc.).
          </li>
          <li>
            <strong>Deposita colateral</strong>: Bloquea BTC/lstBTC en el vault como garantía.
          </li>
          <li>
            <strong>Solicita préstamo</strong>: Recibe USDT basado en tu LTV (Loan-to-Value).
          </li>
          <li>
            <strong>Monitorea salud</strong>: Mantén tu Health Factor (HF) por encima de 1.5.
          </li>
        </ol>
        <h3 className="text-base font-semibold mt-4">Conceptos clave</h3>
        <ul className="mt-2 space-y-1 text-sm">
          <li><strong>LTV</strong>: deuda / valor del colateral (USD). No superar el LTV de liquidación.</li>
          <li><strong>Health Factor (HF)</strong>: colchón de seguridad sobre LTV. Objetivo HF ≥ 1.5.</li>
          <li><strong>Oráculos</strong>: Pyth/RedStone con límites de staleness y desviación.</li>
        </ul>
      </section>
    </div>
  )
}


