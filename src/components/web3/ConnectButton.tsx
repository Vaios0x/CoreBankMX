import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { coreMainnet, coreTestnet } from '../../lib/chains'
import { motion } from 'framer-motion'
import { ConnectButton as RKConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const wrongNetwork = chainId !== coreMainnet.id && chainId !== coreTestnet.id

  return (
    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 w-full sm:w-auto">
      <div className="w-full sm:w-auto">
        <RKConnectButton 
          accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} 
          chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }} 
          showBalance={false} 
        />
      </div>
      {isConnected && wrongNetwork && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-primary text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 w-full sm:w-auto"
          onClick={() => switchChain({ chainId: coreMainnet.id })}
        >
          Switch to Core
        </motion.button>
      )}
    </div>
  )
}

export default ConnectButton


