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
    <div className="flex items-center gap-2">
      <RKConnectButton accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }} showBalance={false} />
      {isConnected ? (
        <>
          <span className="hidden text-sm text-gray-400 sm:inline" aria-label="Connected address">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
          {wrongNetwork && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-xs px-2 py-1"
              onClick={() => switchChain({ chainId: coreMainnet.id })}
            >
              Switch to Core
            </motion.button>
          )}
        </>
      ) : null}
    </div>
  )
}

export default ConnectButton


