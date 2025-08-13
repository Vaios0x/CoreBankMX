import { useToastStore } from '../components/ui/Toast'

export default function Liquidity() {
  const { push } = useToastStore()
  const onCompound = () => {
    const apr = 0.12
    const days = 30
    const principal = 1000
    const future = principal * Math.pow(1 + apr / 365, days)
    push({ type: 'info', message: `APR 12% — 30d compound preview: ~$${future.toFixed(2)}` })
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Liquidity</h1>
      <div className="card p-4">
        <p className="text-sm text-gray-300">Dual Staking (ERC4626) — APR preview and compound simulation.</p>
        <div className="mt-3 flex gap-2">
          <button className="btn-outline motion-press">Stake</button>
          <button className="btn-outline motion-press">Unstake</button>
          <button onClick={onCompound} className="btn-primary motion-press">Compound preview</button>
        </div>
      </div>
    </div>
  )
}


