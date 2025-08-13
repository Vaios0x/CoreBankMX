import { env } from '../lib/env'
import DocsSidebar from '../components/docs/DocsSidebar'

export default function DocsProtocol() {
  return (
    <div className="space-y-6 md:flex md:gap-6">
      <div className="hidden md:block"><DocsSidebar /></div>
      <header className="card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Docs del protocolo</h1>
        <p className="mt-1 text-ui-muted">Arquitectura on-chain, oráculos y parámetros de mercado.</p>
      </header>
      <section className="card p-6 prose prose-invert max-w-none">
        <h2>Arquitectura</h2>
        <ul>
          <li><code>LoanManager</code>: gestiona préstamos y LTV.</li>
          <li><code>CollateralVault</code>: custodia de colaterales, ERC20 compatibles.</li>
          <li><code>OracleRouter</code> y adaptadores (Pyth/RedStone).</li>
        </ul>
        <h3>Parámetros clave</h3>
        <ul>
          <li>Target LTV y Liquidation LTV (consulta <em>services/api/src/routes/market.ts</em>).</li>
          <li>Staleness/Deviation thresholds para oráculos.</li>
        </ul>
        <p>
          Documentación externa: <a href={env.DOCS_URL} target="_blank" rel="noreferrer">{env.DOCS_URL}</a>
        </p>
      </section>
    </div>
  )
}


