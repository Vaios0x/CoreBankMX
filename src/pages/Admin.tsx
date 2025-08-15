import { useI18n } from '../i18n/i18n'

// Solo lectura de parámetros; mock simple
export default function Admin() {
  const t = useI18n()
  
  const marketParams = [
    { name: 'Base Rate', value: '5.00%', description: 'Interest rate for borrowing' },
    { name: 'Target LTV', value: '60%', description: 'Recommended loan-to-value ratio' },
    { name: 'Liquidation LTV', value: '75%', description: 'LTV threshold for liquidation' },
    { name: 'Origination Fee', value: '0.5%', description: 'Fee charged on new loans' }
  ]
  
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('admin.title') as string}</h1>
        <p className="mt-1 text-sm text-ui-muted">{t('admin.subtitle') as string}</p>
      </div>

      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-3">
        <h2 className="text-lg font-medium text-center">{t('admin.market_params') as string}</h2>
        {marketParams.map((param, index) => (
          <div key={index} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{param.name}</h3>
              <span className="text-lg font-semibold text-brand-400">{param.value}</span>
            </div>
            <p className="text-xs text-ui-muted">{param.description}</p>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <section className="card p-5">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('admin.market_params') as string}</caption>
            <thead>
              <tr className="border-b border-ui">
                <th className="text-left py-2 font-medium">{t('admin.parameter') as string}</th>
                <th className="text-right py-2 font-medium">{t('admin.value') as string}</th>
              </tr>
            </thead>
            <tbody>
              {marketParams.map((param, index) => (
                <tr key={index} className={index < marketParams.length - 1 ? "border-b border-ui/50" : ""}>
                  <td className="py-2">{param.name}</td>
                  <td className="py-2 text-right">{param.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Info Section */}
      <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-md bg-gray-800/50 border border-gray-700">
        <h3 className="text-sm font-medium mb-2">{t('admin.info_title') as string}</h3>
        <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
          <li>• {t('admin.info_readonly') as string}</li>
          <li>• {t('admin.info_parameters') as string}</li>
          <li>• {t('admin.info_governance') as string}</li>
        </ul>
      </div>
    </div>
  )
}


