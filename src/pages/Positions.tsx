import { usePositionsStore } from '../state/usePositionsStore'
import { useOracle } from '../hooks/useOracle'
import { computeHealthFactor, computeLtv } from '../lib/ltv'
import { useI18n } from '../i18n/i18n'
import { Link, useLocation } from 'react-router-dom'
import { formatUSD } from '../lib/format'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { env } from '../lib/env'
import { Badge } from '../components/ui/Badge'

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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold">{t('nav.positions')}</h1>
        <p className="text-sm text-ui-muted mt-1">{t('positions.subtitle') as string}</p>
      </div>

      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-3">
        {positions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ui-muted">{t('positions.empty')}</p>
          </div>
        ) : (
          positions.map((p) => {
            const collateralUsd = (p.collateralBtc * (price ?? 0))
            const debtUsd = p.debtUsdt
            const hf = computeHealthFactor(collateralUsd, debtUsd)
            const ltv = computeLtv(collateralUsd, debtUsd)
            
            return (
              <div key={p.id} className="card p-4 space-y-3">
                {/* Position Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{p.id}</h3>
                  <Badge 
                    variant={hf < 1.2 ? 'error' : hf < 1.5 ? 'warning' : 'success'}
                    className="text-xs"
                  >
                    HF: {hf.toFixed(2)}
                  </Badge>
                </div>

                {/* Position Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-ui-muted text-xs">{t('positions.collateral_label') as string}</span>
                    <p className="font-medium">{p.collateralBtc.toFixed(6)} BTC</p>
                    <p className="text-xs text-ui-muted">{formatUSD(collateralUsd)}</p>
                  </div>
                  <div>
                    <span className="text-ui-muted text-xs">{t('positions.debt_label') as string}</span>
                    <p className="font-medium">{p.debtUsdt.toFixed(2)} USDT</p>
                    <p className="text-xs text-ui-muted">{formatUSD(debtUsd)}</p>
                  </div>
                </div>

                {/* LTV */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ui-muted">{t('positions.ltv_label') as string}</span>
                  <span className="font-medium">{(ltv * 100).toFixed(2)}%</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to={`/borrow?${(() => { const params = new URLSearchParams(location.search); if (p.collateralBtc) params.set('collateral', String(p.collateralBtc)); return params.toString() })()}`}
                    className="btn-outline text-xs py-2 motion-press text-center"
                  >
                    {t('positions.add_collateral')}
                  </Link>
                  <Link
                    to={`/repay?${(() => { const params = new URLSearchParams(location.search); if (p.debtUsdt) params.set('repay', String(Math.min(50, p.debtUsdt))); return params.toString() })()}`}
                    className="btn-primary text-xs py-2 motion-press text-center"
                  >
                    {t('positions.repay')}
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-gray-800 dark:divide-ui" role="table" aria-label="Positions table">
            <caption className="sr-only">Tabla de posiciones de usuario</caption>
            <thead className="bg-gray-900">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">ID</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Collateral (BTC)</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Debt (USDT)</th>
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
                      <td className="px-4 py-2 text-sm">{p.collateralBtc.toFixed(6)}</td>
                      <td className="px-4 py-2 text-sm">{p.debtUsdt.toFixed(2)}</td>
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
      </div>

      {/* Price Info */}
      <div className="rounded-md border border-gray-800 bg-gray-900 p-3 sm:p-4 text-xs sm:text-sm text-ui-muted">
        <p>
          {t('positions.note_prices')}: {price ? formatUSD(price) : '—'} {t('positions.note_prices_suffix')}
        </p>
      </div>
    </div>
  )
}


