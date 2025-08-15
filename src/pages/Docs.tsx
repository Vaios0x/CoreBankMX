import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/i18n'
import { CONTRACTS, NETWORK_CONFIG } from '../lib/contracts'
import ExplorerLink from '../components/web3/ExplorerLink'

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

      {/* Deployed Contracts Section */}
      <section className="card p-5">
        <h2 className="text-lg font-semibold mb-4">Contratos Desplegados</h2>
        <p className="text-sm text-ui-muted mb-4">
          Todos los contratos desplegados en Core Testnet2 (Chain ID: {NETWORK_CONFIG.ChainId})
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Core Protocol Contracts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-brand-400">Protocolo Principal</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">CollateralVault</div>
                <ExplorerLink type="address" hash={CONTRACTS.CollateralVault} />
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">LoanManager</div>
                <ExplorerLink type="address" hash={CONTRACTS.LoanManager} />
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">LiquidationModule</div>
                <ExplorerLink type="address" hash={CONTRACTS.LiquidationModule} />
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">DualStakingVault</div>
                <ExplorerLink type="address" hash={CONTRACTS.DualStakingVault} />
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">FeeController</div>
                <ExplorerLink type="address" hash={CONTRACTS.FeeController} />
              </div>
            </div>
          </div>

          {/* Oracle Infrastructure */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-brand-400">Infraestructura Oracle</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">OracleRouter</div>
                <ExplorerLink type="address" hash={CONTRACTS.OracleRouter} />
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">RedStoneAdapter</div>
                <ExplorerLink type="address" hash={CONTRACTS.RedStoneAdapter} />
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">PythAdapter</div>
                <ExplorerLink type="address" hash={CONTRACTS.PythAdapter} />
              </div>
            </div>
          </div>

          {/* Token Contracts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-brand-400">Tokens</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">LSTBTC</div>
                <ExplorerLink type="address" hash={CONTRACTS.LSTBTC} />
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">USDT</div>
                <ExplorerLink type="address" hash={CONTRACTS.USDT} />
              </div>
            </div>
            
            <h3 className="text-sm font-medium text-brand-400">Administración</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gray-800/30">
                <div className="font-medium text-sm">Admin</div>
                <ExplorerLink type="address" hash={CONTRACTS.Admin} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            <strong>Explorer:</strong> <a href={NETWORK_CONFIG.Explorer} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">{NETWORK_CONFIG.Explorer}</a>
          </p>
        </div>
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


