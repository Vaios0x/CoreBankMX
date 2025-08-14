import { usePositionsStore } from '../state/usePositionsStore'
import { useOracle } from '../hooks/useOracle'
import { computeHealthFactor, computeLtv } from '../lib/ltv'
import { useI18n } from '../i18n/i18n'
import { Link, useLocation } from 'react-router-dom'
import { formatUSD } from '../lib/format'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { env } from '../lib/env'

export default function Positions() {
  const location = useLocation()
  const { positions } = usePositionsStore()
  const { data: price } = useOracle()
  const t = useI18n()
  const { address } = useAccount()

  // Cargar posición real desde API si hay address
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!address) return
      try {
        const res = await fetch(`${env.API_URL}/positions/${address}`)
        const json = await res.json()
        if (!mounted) return
        if (json && json.debt && json.collateral) {
          // Interpretar colateral como BTC (18d) y deuda como USDT (18d en mocks)
          const collateralBtc = Number(json.collateral) / 1e18
          const debtUsdt = Number(json.debt) / 1e18
          usePositionsStore.getState().setPositions([{ id: 'current', collateralBtc, debtUsdt }])
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [address])

  // Fallback on-chain directo si la API no está disponible
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!address || positions.length > 0) return
      try {
        const loanAddr = env.LOAN_MANAGER as `0x${string}`
        if (!loanAddr || loanAddr === '0x0000000000000000000000000000000000000000') return
        const viemMod = await (new Function('env', `return import('viem')`) as (env: any) => Promise<any>)(env)
        const { createPublicClient, http, getContract } = viemMod
        const chainId = env.CHAIN_ID_TESTNET
        const rpc = env.RPC_TESTNET
        const chain = { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any
        const client = createPublicClient({ transport: http(rpc), chain })
        const abi = [{ inputs: [{ name: 'user', type: 'address' }], name: 'getAccountData', outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' }] as const
        const contract = getContract({ address: loanAddr, abi: abi as any, client })
        const result = await contract.read.getAccountData([address])
        if (cancelled) return
        const collateral = Number((result as any)[0]) / 1e18
        const debt = Number((result as any)[1]) / 1e18
        if (Number.isFinite(collateral) && Number.isFinite(debt)) {
          usePositionsStore.getState().setPositions([{ id: 'current', collateralBtc: collateral, debtUsdt: debt }])
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [address, positions.length])
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t('nav.positions')}</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-gray-800 dark:divide-ui" role="table" aria-label="Positions table">
          <caption className="sr-only">Tabla de posiciones de usuario</caption>
          <thead className="bg-gray-900">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">ID</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Collateral (BTC)</th>
              <th scope="col" className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted sm:table-cell">Debt (USDT)</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">LTV</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">HF</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">{t('positions.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 dark:divide-ui">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-ui-muted">{t('positions.empty')}</td>
              </tr>
            ) : (
              positions.map((p) => {
                const collateralUsd = (p.collateralBtc * (price ?? 0))
                const debtUsd = p.debtUsdt
                const hf = computeHealthFactor(collateralUsd, debtUsd)
                const ltv = computeLtv(collateralUsd, debtUsd)
                return (
                  <tr key={p.id}>
                    <th scope="row" className="px-4 py-2 text-sm font-medium">{p.id}</th>
                    <td className="px-4 py-2 text-sm">{p.collateralBtc}</td>
                    <td className="hidden px-4 py-2 text-sm sm:table-cell">{p.debtUsdt}</td>
                    <td className="px-4 py-2 text-sm">{(ltv * 100).toFixed(2)}%</td>
                    <td className={`px-4 py-2 text-sm ${hf < 1.2 ? 'text-red-400' : hf < 1.5 ? 'text-yellow-400' : 'text-green-400'}`}>{hf.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/borrow?${(() => { const params = new URLSearchParams(location.search); if (p.collateralBtc) params.set('collateral', String(p.collateralBtc)); return params.toString() })()}`}
                          className="btn-outline text-xs px-2 py-1 motion-press"
                        >
                          {t('positions.add_collateral')}
                        </Link>
                        <Link
                          to={`/repay?${(() => { const params = new URLSearchParams(location.search); if (p.debtUsdt) params.set('repay', String(Math.min(50, p.debtUsdt))); return params.toString() })()}`}
                          className="btn-primary text-xs px-2 py-1 motion-press"
                        >
                          {t('positions.repay')}
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-md border border-gray-800 bg-gray-900 p-3 text-xs text-ui-muted">
        <p>
          {t('positions.note_prices')}: {price ? formatUSD(price) : '—'} {t('positions.note_prices_suffix')}
        </p>
      </div>
    </div>
  )
}


