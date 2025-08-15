import { useChainId } from 'wagmi'
import { env } from '../../lib/env'

export function ExplorerLink({ hash, type = 'tx' }: { hash: string; type?: 'tx' | 'address' }) {
  const chainId = useChainId()
  const base = chainId === env.CHAIN_ID_MAINNET ? env.EXPLORER_MAINNET : env.EXPLORER_TESTNET
  const path = type === 'tx' ? `/tx/${hash}` : `/address/${hash}`
  const href = `${base}${path}`
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm break-all sm:break-words"
      title={`View ${type === 'tx' ? 'transaction' : 'address'} on explorer`}
    >
      {type === 'tx' ? 'View TX' : 'View Address'}
    </a>
  )
}

export default ExplorerLink


