import { useToastStore } from '../components/ui/Toast'
import { useStaking } from '../hooks/useStaking'
import Input from '../components/ui/Input'
import { useState } from 'react'

export default function Liquidity() {
  const { push } = useToastStore()
  const { approveStake, stake, unstake } = useStaking()
  const [amount, setAmount] = useState(0)
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
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="w-48">
            <Input name="stake_amount" label="Amount" type="number" step="any" value={amount} onChange={(v) => setAmount(Number(v || 0))} />
          </div>
          <button className="btn-outline motion-press" onClick={async () => { try { const h = await approveStake(amount); push({ type: 'success', message: `Approve sent ${String(h).slice(0,10)}…` }) } catch (e: any) { push({ type: 'error', message: e?.message || 'Approve failed' }) } }}>Approve</button>
          <button className="btn-outline motion-press" onClick={async () => { try { const h = await stake(amount); push({ type: 'success', message: `Stake sent ${String(h).slice(0,10)}…` }) } catch (e: any) { push({ type: 'error', message: e?.message || 'Stake failed' }) } }}>Stake</button>
          <button className="btn-outline motion-press" onClick={async () => { try { const h = await unstake(amount); push({ type: 'success', message: `Unstake sent ${String(h).slice(0,10)}…` }) } catch (e: any) { push({ type: 'error', message: e?.message || 'Unstake failed' }) } }}>Unstake</button>
          <button onClick={onCompound} className="btn-primary motion-press">Compound preview</button>
        </div>
      </div>
    </div>
  )
}


