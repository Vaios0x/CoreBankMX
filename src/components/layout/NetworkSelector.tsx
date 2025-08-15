import { motion, AnimatePresence } from 'framer-motion'
import { useChainId, useSwitchChain } from 'wagmi'
import { coreMainnet, coreTestnet } from '../../lib/chains'
import { useI18n } from '../../i18n/i18n'

interface NetworkSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export function NetworkSelector({ isOpen, onClose }: NetworkSelectorProps) {
  const { t } = useI18n()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  
  const networks = [
    {
      id: coreMainnet.id,
      name: 'Core',
      description: 'Core Mainnet',
      icon: '🟢',
      color: 'bg-green-500',
      isActive: chainId === coreMainnet.id
    },
    {
      id: coreTestnet.id,
      name: 'Testnet2',
      description: 'Core Testnet2',
      icon: '🟡',
      color: 'bg-yellow-400',
      isActive: chainId === coreTestnet.id
    }
  ]

  const handleNetworkSelect = async (targetChainId: number) => {
    if (targetChainId === chainId) {
      onClose()
      return
    }

    try {
      // Update localStorage
      localStorage.setItem('core_neobank_chain_id', String(targetChainId))
      
      // Update URL
      const url = new URL(window.location.href)
      url.searchParams.set('chain', String(targetChainId))
      window.history.replaceState({}, '', url)
      
      // Switch chain
      await switchChain({ chainId: targetChainId })
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            aria-hidden="true"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-ui-surface rounded-lg border border-ui shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-ui">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {t('network_selector.title') as string}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  aria-label={t('network_selector.close') as string}
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* Network Options */}
              <div className="p-4 sm:p-6 space-y-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkSelect(network.id)}
                    disabled={isPending}
                    className={`w-full p-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      network.isActive
                        ? 'border-brand-500 bg-brand-500/10 text-white'
                        : 'border-ui hover:border-gray-600 hover:bg-gray-800/50 text-gray-300 hover:text-white'
                    } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          {network.icon}
                        </span>
                        <span className={`inline-block h-3 w-3 rounded-full ${network.color}`} aria-hidden />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-base">
                          {network.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {network.description}
                        </div>
                      </div>
                      {network.isActive && (
                        <span className="text-brand-400 text-lg" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-ui bg-gray-900/30">
                <div className="text-xs text-gray-400 text-center">
                  {t('network_selector.footer_text') as string}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NetworkSelector
