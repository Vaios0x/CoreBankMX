export default function Admin() {
  // Solo lectura de parámetros; mock simple
  const params = [
    { key: 'Base Rate', value: '5% APR' },
    { key: 'Target LTV', value: '60%' },
    { key: 'Liquidation LTV', value: '80%' },
  ]
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin (read-only)</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-gray-800 dark:divide-ui">
          <caption className="sr-only">Parámetros de mercado (solo lectura)</caption>
          <thead>
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Param</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 dark:divide-ui">
            {params.map((p) => (
              <tr key={p.key}>
                <th scope="row" className="px-4 py-2 text-sm font-medium">{p.key}</th>
                <td className="px-4 py-2 text-sm">
                  <span>{p.value}</span>
                  <button
                    className="ml-2 btn-outline px-2 py-0.5 text-xs motion-press"
                    onClick={() => navigator.clipboard.writeText(p.value)}
                  >
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


