import { env } from '../lib/env'
import DocsSidebar from '../components/docs/DocsSidebar'

export default function DocsApi() {
  return (
    <div className="space-y-6 md:flex md:gap-6">
      <div className="hidden md:block"><DocsSidebar /></div>
      <header className="card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">API</h1>
        <p className="mt-1 text-ui-muted">Endpoints del servicio en <code>services/api</code>.</p>
      </header>
      <section className="card p-6 prose prose-invert max-w-none">
        <h2>Endpoints</h2>
        <ul>
          <li><code>GET /status</code>: estado de red, contratos y keeper.</li>
          <li><code>GET /market/params</code>: parámetros del mercado.</li>
          <li><code>GET /market/prices/:symbol</code>: precio por símbolo (usa caché/oráculo).</li>
        </ul>
        <p>
          Base URL: <a href={env.API_URL} target="_blank" rel="noreferrer">{env.API_URL}</a>
        </p>
      </section>
    </div>
  )
}


