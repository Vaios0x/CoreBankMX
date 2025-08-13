import { NavLink } from 'react-router-dom'

export function DocsSidebar() {
  const items = [
    { to: '/docs', label: 'Inicio' },
    { to: '/docs/protocol', label: 'Protocolo' },
    { to: '/docs/api', label: 'API' },
    { to: '/docs/status', label: 'Estado' },
  ]
  return (
    <aside className="sticky top-16 h-[calc(100vh-64px)] w-full max-w-xs space-y-2 border-r border-ui pr-4 text-sm">
      <nav aria-label="Docs">
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.to}>
              <NavLink
                to={i.to}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isActive ? 'bg-gray-800 text-white' : 'text-gray-300'
                  }`
                }
              >
                {i.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default DocsSidebar


