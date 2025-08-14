import { useI18n } from '../i18n/i18n'

// Solo lectura de parámetros; mock simple
export default function Admin() {
  const t = useI18n()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.title') as string}</h1>
        <p className="mt-1 text-ui-muted">{t('admin.subtitle') as string}</p>
      </div>

      <section className="card p-5">
        <table className="w-full text-sm">
          <caption className="sr-only">{t('admin.market_params') as string}</caption>
          <thead>
            <tr className="border-b border-ui">
              <th className="text-left py-2 font-medium">Parámetro</th>
              <th className="text-right py-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ui/50">
              <td className="py-2">Base Rate</td>
              <td className="py-2 text-right">5.00%</td>
            </tr>
            <tr className="border-b border-ui/50">
              <td className="py-2">Target LTV</td>
              <td className="py-2 text-right">60%</td>
            </tr>
            <tr className="border-b border-ui/50">
              <td className="py-2">Liquidation LTV</td>
              <td className="py-2 text-right">75%</td>
            </tr>
            <tr>
              <td className="py-2">Origination Fee</td>
              <td className="py-2 text-right">0.5%</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}


