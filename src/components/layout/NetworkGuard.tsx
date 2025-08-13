import type { ReactNode } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { coreMainnet, coreTestnet } from '../../lib/chains'

export function NetworkGuard({ children }: { children: ReactNode }) {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const ok = chainId === coreMainnet.id || chainId === coreTestnet.id
  if (ok) return <>{children}</>
  return (
    <div className="m-4 rounded-md border border-yellow-700 bg-yellow-900/30 p-4 text-yellow-200">
      <p className="mb-3 font-medium">Wrong network</p>
      <button
        className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        onClick={() => switchChain({ chainId: coreMainnet.id })}
      >
        Switch to Core
      </button>
    </div>
  )
}

export default NetworkGuard


