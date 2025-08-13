import { Link } from 'react-router-dom'
import { env } from '../lib/env'
import DocsSidebar from '../components/docs/DocsSidebar'

export default function Docs() {
  return (
    <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">
      <div className="hidden md:block"><DocsSidebar /></div>
      <div className="space-y-6">
        <header className="card p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Documentación</h1>
          <p className="mt-1 text-ui-muted">Guías rápidas, referencias y enlaces útiles del proyecto.</p>
        </header>

        <section className="card p-6 grid grid-cols-1 gap-6 md:grid-cols-3 auto-rows-fr">
          <Link to="/docs/protocol" className="card p-4 hover-glow h-full">
          <h2 className="text-sm font-medium">Flujo: Borrow</h2>
          <p className="mt-1 text-sm text-ui-muted">Cómo solicitar préstamo con BTC como colateral y entender LTV/HF.</p>
        </Link>
          <Link to="/docs/api" className="card p-4 hover-glow h-full">
          <h2 className="text-sm font-medium">Flujo: Repay</h2>
          <p className="mt-1 text-sm text-ui-muted">Repago de deuda y retiro de colateral de forma segura.</p>
        </Link>
          <Link to="/docs/status" className="card p-4 hover-glow h-full">
          <h2 className="text-sm font-medium">Posiciones</h2>
          <p className="mt-1 text-sm text-ui-muted">Visualiza tus posiciones, LTV e indicadores de riesgo.</p>
        </Link>
        </section>

        <section className="card p-6 prose prose-invert max-w-none">
        <h2>Conceptos clave</h2>
        <ul>
          <li><strong>LTV</strong>: deuda / valor del colateral (USD). No superar el LTV de liquidación.</li>
          <li><strong>Health Factor (HF)</strong>: colchón de seguridad sobre LTV. Objetivo HF ≥ 1.5.</li>
          <li><strong>Oráculos</strong>: Pyth/RedStone con límites de staleness y desviación.</li>
        </ul>
        <h3>Stack del proyecto</h3>
        <ul>
          <li>Frontend: React + Vite, Tailwind, Framer Motion, RainbowKit/Wagmi.</li>
          <li>Contratos: Solidity (paquete <code>packages/contracts</code>).</li>
          <li>Servicios: Fastify en <code>services/api</code> y un keeper en <code>services/keeper</code>.</li>
        </ul>
        <h3>Estilos y componentes</h3>
        <ul>
          <li>Utilidades internas: <code>btn</code>, <code>card</code>, <code>alert</code>, <code>badge</code>, <code>ui.*</code>, <code>motion-* </code>.</li>
          <li>Dark mode por clase <code>dark</code> (persistencia en <code>localStorage</code>).</li>
        </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-medium">Enlaces externos</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a className="btn-outline motion-press w-full text-center" href={env.DOCS_URL} target="_blank" rel="noreferrer">Docs del protocolo</a>
            <a className="btn-outline motion-press w-full text-center" href={env.API_URL} target="_blank" rel="noreferrer">API</a>
            <a className="btn-outline motion-press w-full text-center" href={env.STATUS_URL} target="_blank" rel="noreferrer">Estado</a>
          </div>
        </section>
      </div>
    </div>
  )
}


