import { useI18n } from '../i18n/i18n'
import { motion } from 'framer-motion'
import { formatUSD } from '../lib/format'

// Solo lectura de parámetros; mock simple
export default function Admin() {
  const t = useI18n()
  
  const marketParams = [
    { 
      name: 'Base Rate', 
      value: '5.00%', 
      description: 'Interest rate for borrowing',
      category: 'Interest',
      color: 'text-blue-400'
    },
    { 
      name: 'Target LTV', 
      value: '60%', 
      description: 'Recommended loan-to-value ratio',
      category: 'Risk',
      color: 'text-green-400'
    },
    { 
      name: 'Liquidation LTV', 
      value: '75%', 
      description: 'LTV threshold for liquidation',
      category: 'Risk',
      color: 'text-red-400'
    },
    { 
      name: 'Origination Fee', 
      value: '0.5%', 
      description: 'Fee charged on new loans',
      category: 'Fees',
      color: 'text-yellow-400'
    },
    { 
      name: 'Min Borrow Amount', 
      value: '$100', 
      description: 'Minimum amount to borrow',
      category: 'Limits',
      color: 'text-purple-400'
    },
    { 
      name: 'Max Borrow Amount', 
      value: '$1M', 
      description: 'Maximum amount to borrow',
      category: 'Limits',
      color: 'text-purple-400'
    },
    { 
      name: 'Liquidation Penalty', 
      value: '8%', 
      description: 'Penalty for liquidated positions',
      category: 'Risk',
      color: 'text-red-400'
    },
    { 
      name: 'Protocol Fee', 
      value: '0.1%', 
      description: 'Protocol revenue fee',
      category: 'Fees',
      color: 'text-yellow-400'
    }
  ]

  const protocolStats = [
    { label: 'Total Value Locked', value: formatUSD(2850000), change: '+12.5%', positive: true },
    { label: 'Total Borrowed', value: formatUSD(1850000), change: '+8.2%', positive: true },
    { label: 'Active Positions', value: '47', change: '+3', positive: true },
    { label: 'Liquidations 24h', value: '3', change: '-1', positive: false },
    { label: 'Protocol Revenue', value: formatUSD(12500), change: '+15.3%', positive: true },
    { label: 'Average LTV', value: '58.2%', change: '-2.1%', positive: true }
  ]
  
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('admin.title') as string}</h1>
        <p className="mt-1 text-sm text-ui-muted">{t('admin.subtitle') as string}</p>
      </div>

      {/* Protocol Stats */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 sm:p-5"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Protocol Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {protocolStats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 sm:p-4 rounded-lg bg-gray-800/30"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ui-muted">{stat.label}</span>
                <span className={`text-xs ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-semibold">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Market Parameters */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-4 sm:p-5"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('admin.market_params') as string}</h2>
        
        {/* Mobile Cards View */}
        <div className="block sm:hidden space-y-3">
          {marketParams.map((param, index) => (
            <motion.div 
              key={param.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 space-y-2 border border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{param.name}</h3>
                  <span className="text-xs text-ui-muted">{param.category}</span>
                </div>
                <span className={`text-lg font-semibold ${param.color}`}>{param.value}</span>
              </div>
              <p className="text-xs text-ui-muted">{param.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('admin.market_params') as string}</caption>
            <thead>
              <tr className="border-b border-ui">
                <th className="text-left py-3 font-medium">{t('admin.parameter') as string}</th>
                <th className="text-center py-3 font-medium">Category</th>
                <th className="text-right py-3 font-medium">{t('admin.value') as string}</th>
              </tr>
            </thead>
            <tbody>
              {marketParams.map((param, index) => (
                <motion.tr 
                  key={param.name}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={index < marketParams.length - 1 ? "border-b border-ui/50" : ""}
                >
                  <td className="py-3">
                    <div>
                      <div className="font-medium">{param.name}</div>
                      <div className="text-xs text-ui-muted">{param.description}</div>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                      {param.category}
                    </span>
                  </td>
                  <td className={`py-3 text-right font-semibold ${param.color}`}>
                    {param.value}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Governance Info */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-4 sm:p-5"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Governance & Control</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-green-400">✅ Active Controls</h3>
            <ul className="text-xs sm:text-sm text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Emergency pause functionality
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Oracle circuit breakers
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Rate limiting mechanisms
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-yellow-400">⚠️ Pending Actions</h3>
            <ul className="text-xs sm:text-sm text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Governance token distribution
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                DAO proposal system
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Multi-sig wallet setup
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Info Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="card p-4 sm:p-5 space-y-3"
      >
        <h3 className="text-sm font-medium">{t('admin.info_title') as string}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-gray-300">
          <div className="space-y-1">
            <p className="font-medium">📖 {t('admin.info_readonly') as string}</p>
            <p className="text-xs text-gray-400">Parameters are read-only in demo mode</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">⚙️ {t('admin.info_parameters') as string}</p>
            <p className="text-xs text-gray-400">Market parameters control protocol behavior</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">🏛️ {t('admin.info_governance') as string}</p>
            <p className="text-xs text-gray-400">Governance will control parameter updates</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


