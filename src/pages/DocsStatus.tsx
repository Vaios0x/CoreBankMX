import { env } from '../lib/env'
import DocsSidebar from '../components/docs/DocsSidebar'

export default function DocsStatus() {
  return (
    <div className="space-y-6 md:flex md:gap-6">
      <div className="hidden md:block"><DocsSidebar /></div>
      <header className="card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Estado</h1>
        <p className="mt-1 text-ui-muted">Monitoreo de servicios y contratos.</p>
      </header>
      <section className="card p-6 prose prose-invert max-w-none">
        <p>
          Consulta el estado en tiempo real: <a href={env.STATUS_URL} target="_blank" rel="noreferrer">{env.STATUS_URL}</a>
        </p>
        <p>
          El endpoint <code>/status</code> del API devuelve detalles de redes, RPCs y direcciones de contratos desplegados.
        </p>
      </section>
    </div>
  )
}


